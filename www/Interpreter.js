class Interpreter {
    constructor(ast, out){
        this.ast = ast;
        this.out = out;
        this.global = new Scope(null);
        this.native = new Builtins(this);
    }
    run(){
        while(!this.ast.empty()){
            try {
                var exp = this.ast.next();
                this.evalExpression(exp,this.global);
            } catch(e) {
		console.log(e);
                this.rethrowError(e);
            }
        }
    }
    evalBlock(block,scope){
        var result = null;
        for(var i = 0; i < block.length; i++){
            result = this.evalExpression(block[i], scope);
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
                exp.vector = this.evalExpression(exp.vector, scope);
                return this.evalExpression(exp, scope);
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
            return this.evalBlock(func.body, newscope);
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
                return this.evalBlock(exp.then,scope);
            }
            if(exp.hasOwnProperty("else")){
                return this.evalBlock(exp.else,scope);
            }
            return null;
        }
        if(exp.type == "for"){
            if(exp.iter.type != "binary"){
                this.die("Improper iteration syntax");
            }
            //TODO
            return null;
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
    isAtom(exp){
        return exp.type == "symbol" || exp.type == "int" || exp.type == "float" || exp.type == "string" || exp.type == "boolean" || exp.type == "vector";
    }
    rethrowError(e){
        this.out.println(e);
    }
    die(msg){
        this.out.println("Interpreter Error: " + msg);
    }
}
