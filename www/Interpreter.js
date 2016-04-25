class Interpreter {
    constructor(ast, out){
        this.ast = ast;
        this.out = out;
        this.global = new Scope(null);
        this.native = new Builtins(this);
    }

    run(){
        var start = Date.now();
        while(!this.ast.empty()){
            try {
                var exp = this.ast.next();
                this.evalExpression(exp,this.global);
            } catch(e) {
                console.log(e);
                this.rethrowError(e);
            }
        }
        this.out.println("Execution finished " + (Date.now() - start) + "ms");
    }

    evalBlock(block,scope, type){
        if(type == undefined) alert("ya fucked up twice!");
        var result = null;
        for(var i = 0; i < block.length; i++){
            var temp = this.evalExpression(block[i], scope);
            if(temp && temp.type == "break"){
                if(type == "if" || type == "for" || type == "while" || type == "funceval")
                    return temp;
            }
            result = temp;
        }
        return result;
    }
    evalExpression(exp, scope){
        if(scope == undefined){
            console.log("YOU FUCKED UP");
            alert("ya fucked up brah");
        }
        if(exp.type == "assign"){
            if(exp.left.type == "indexing"){
                var vec = this.evalExpression(exp.left.vector,scope);
                var right = this.evalExpression(exp.right, scope);
                for(var i = 0; i < exp.left.indices.length; i++){
                    var j = this.evalExpression(exp.left.indices[i],scope);
                    vec.value[j.value] = right;
                }
                return vec;
            }
            if(exp.left.type == "symbol"){
                var right = this.evalExpression(exp.right,scope);
                scope.addSymbol(exp.left,  right);
                return right;
            }
            var name = exp.left.value;
            this.die("Invalid assignment target: " + name);
        }
        if(exp.type == "indexing"){
            if(exp.vector.type == "indexing"){
                var temp = {type:"indexing", vector:this.evalExpression(exp.vector, scope), indices: exp.indices};
                return this.evalExpression(temp, scope);
            }
            if(exp.vector.type == "vector"){
                var vec = [];
                for(var i = 0; i < exp.indices.length; i++){
                    var j = this.evalExpression(exp.indices[i],scope);
                    var k = this.evalExpression(exp.vector.value[j.value], scope);
                    vec.push(k);
                }
                if(vec.length > 1)
                    return {type: "vector", value: vec, length: vec.length};
                if(vec.length == 1) 
                    return vec[0];
                return null;
            }
            if(exp.vector.type == "symbol"){
                var vec = scope.find(exp.vector);
                var expr = {type: "indexing", vector: vec, indices: exp.indices};
                return this.evalExpression(expr, scope);
            }
            if(exp.vector.type == "string"){
                var str = "";
                for(var i = 0; i < exp.indices.length; i++){
                    var j = this.evalExpression(exp.indices[i],scope);
                    str = str + exp.vector.value.charAt(j.value);
                }
                return {type:"string", value: str};
            }
            this.die("Unknown form of indexing: " + exp.vector.type);
        }
        if(exp.type == "symbol"){
            return scope.find(exp);
        }
        if(this.isAtom(exp)){
            return exp;
        }
        if(exp.type == "funceval"){
            if(exp.func.value == "println"){
                return this.native.println(exp,scope);
            }
            if(exp.func.value == "print"){
                return this.native.print(exp, scope);
            }
            if(exp.func.value == "length"){
                return this.native.length(exp, scope);
            }
            var func = scope.find(exp.func);
            if(func.type != "lambda"){
                this.die("Symbol not callable: " + exp.func.value);
            }
            if(exp.args.length != func.vars.length){
                this.die("Incorrect number of arguments: " + exp.func.value);
            }
            var newscope = new Scope(scope);
            for(var i = 0; i < exp.args.length; i++){
                newscope.addSymbol({value: func.vars[i]}, this.evalExpression(exp.args[i],scope));
            }
            return this.evalBlock(func.body, newscope, "funceval");
        }
        if(exp.type == "lambda"){
            return exp;
        }
        if(exp.type == "if"){
            var predicate = this.evalExpression(exp.cond, scope);
            if(predicate.type != "boolean"){
                this.die("Cannot evaluate as boolean: " + exp.cond);
            }
            if(predicate.value == true){
                return this.evalBlock(exp.then,scope, "if");
            }
            if(exp.hasOwnProperty("else")){
                return this.evalBlock(exp.else,scope, "if");
            }
            return null;
        }
        if(exp.type == "for"){
            if(exp.iter.type != "binary" || exp.iter.operator != "in"){
                this.die("Improper iteration syntax");
            }
            var vec = this.evalExpression(exp.iter.right,scope);
            if(vec.type != "vector" && vec.type != "string"){
                this.die("Object not iterable: " + exp.iter.right.value);
            }
            var res = null;
            for(var i = 0; i < vec.length; i++){
                if(vec.type == "vector"){
                    scope.addSymbol(exp.iter.left, vec.value[i]);
                } else if(vec.type == "string"){
                    scope.addSymbol(exp.iter.left, {type:"string", value:vec.value.charAt(i)});
                }
                var temp = this.evalBlock(exp.body, scope, "for");
                if(temp && temp.type == "break") 
                    break;
                res = temp;
            }
            return res;
        }
        if(exp.type == "while"){
            var res = null;
            while(this.evalExpression(exp.pred, scope).value){
                temp = this.evalBlock(exp.body, scope, "while");
                if(temp && temp.type == "break")
                    break;
                res = temp; 
            }
            return res;
        }
        if(exp.type == "binary"){
            if(exp.operator == "||"){
                var a = this.evalExpression(exp.left,scope);
                if(a.value == "true") return a;
                return this.evalExpression(exp.right,scope);
            }
            if(exp.operator == "&&"){
                var a = this.evalExpression(exp.left,scope);
                if(a.value == "false") return a;
                return this.evalExpression(exp.right,scope);
            }
            if(exp.operator == ":"){
                if(exp.left.type == "binary" && exp.left.operator == ":"){
                    var start = this.evalExpression(exp.left.left, scope);
                    if(!this.isNumber(start)){
                        this.die("Invalid left argument to colon operator");
                    }
                    var step = this.evalExpression(exp.left.right, scope);
                    if(!this.isNumber(step) || step.value == 0){
                        this.die("Invalid middle argument to colon operator");
                    }
                    var end = this.evalExpression(exp.right, scope);
                    if(!this.isNumber(end)){
                        this.die("Invalid right argument to colon operator");
                    }
                    var vec = [];
                    var iter = start.value;
                    var type = (start.type == "int" && step.type == "int") ? "int" : "float";
                    while((step.value > 0 && iter <= end.value) ||
                          (step.value < 0 && iter >= end.value)){
                        vec.push({type:type, value:iter});
                        iter = iter + step.value;
                    }
                    return {type:"vector", value:vec, length:vec.length};
                } else {
                    var left = this.evalExpression(exp.left, scope);
                    if(!this.isNumber(left)){
                        this.die("Invalid left argument to colon operator");
                    }
                    var right = this.evalExpression(exp.right, scope);
                    if(!this.isNumber(right)){
                        this.die("Invalid right argument to colon operator");
                    }
                    var vec = [];
                    var iter = left.value;
                    var type = left.type;

                    while(iter <= right.value){
                        vec.push({type:type,value:iter});
                        iter = iter + 1;
                    }
                    return {type:"vector", value:vec, length:vec.length};
                }
            }
            var a = this.evalExpression(exp.left,scope);
            var b = this.evalExpression(exp.right,scope);
            if(exp.operator == "<="){
                return {type:"boolean", value: a.value <= b.value};
            }
            if(exp.operator == ">="){
                return {type:"boolean", value: a.value >= b.value};
            }
            if(exp.operator == "=="){
                return {type:"boolean", value: a.value == b.value};
            }
            if(exp.operator == "!="){
                return {type:"boolean", value: a.value != b.value};
            }
            if(exp.operator == "<"){
                return {type:"boolean", value: a.value < b.value};
            }
            if(exp.operator == ">"){
                return {type:"boolean", value: a.value > b.value};
            }
            if(exp.operator == "*"){
                if(a.type == "int" && b.type == "int")
                    return {type:"int", value: a.value*b.value};
                return {type:"float", value: a.value*b.value};
            }
            if(exp.operator == "+"){
                if(a.type == "int" && b.type == "int")
                    return {type:"int", value: a.value+b.value};
                return {type:"float", value: a.value+b.value};
            }
            if(exp.operator == "-"){
                if(a.type == "int" && b.type == "int")
                    return {type:"int", value: a.value-b.value};
                return {type:"float", value: a.value-b.value};
            }
            if(exp.operator == "/"){
                if(a.type == "int" && b.type == "int")
                    return {type:"int", value: a.value/b.value};
                return {type:"float", value: a.value/b.value};
            }
            if(exp.operator == "^"){
                if(a.type == "int" && b.type == "int")
                    return {type:"int", value: math.pow(a.value,b.value)};
                return {type:"float", value: math.pow(a.value+b.value)};
            }
            if(exp.operator == "%"){
                if(a.type == "int" && b.type == "int")
                    return {type:"int", value: math.mod(a.value,b.value)};
                return {type:"float", value: math.mod(a.value+b.value)};
            }
            this.die("Unimplemented operator: " + exp.operator);
        }
        this.die("Unknown expression: " + JSON.stringify(exp));
    }
    isNumber(exp){
        return exp.type == "int" || exp.type == "float";
    }
    isAtom(exp){
        return exp.type == "symbol" || exp.type == "int" || exp.type == "float" || exp.type == "string" || exp.type == "boolean" || exp.type == "vector" || exp.type == "break";
    }
    rethrowError(e){
        this.out.println(e);
    }
    die(msg){
        this.out.println("Interpreter Error: " + msg);
    }
}
