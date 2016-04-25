class Builtins {
    constructor(parent){
        this.parent = parent;
    }
    rawPrint(exp, ln, scope){
        var result = this.parent.evalExpression(exp, scope);
        if(result.type == "vector"){
            this.parent.out.print("[");
            for(var j = 0; j < result.length-1; j++){
                var elem = this.parent.evalExpression(result.value[j], scope);
                if(elem.type == "vector"){
                    this.rawPrint(elem,false,scope);
                } else {
                    this.parent.out.print(elem.value);
                }
                this.parent.out.print(", ");
            }
            var elem = this.parent.evalExpression(result.value[j], scope);
            if(elem.type == "vector"){
                this.rawPrint(elem,false,scope);
            } else {
                this.parent.out.print(elem.value);
            }
            if(ln)
                this.parent.out.println("]");
            else
                this.parent.out.print("]");
        } else {
            if(ln)
                this.parent.out.println(result.value);
            else
                this.parent.out.print(result.value);
        }
        return null;
    }
    println(exp, scope){
        for(var i = 0; i < exp.args.length; i++){
            this.rawPrint(exp.args[i], true, scope);
        }
    }
    print(exp, scope){
        for(var i = 0; i < exp.args.length; i++){
            this.rawPrint(exp.args[i], false, scope);
        }
    }
    length(exp, scope){
        if(exp.args.length > 1){
            this.parent.die("`length` takes exactly one argument.");
            return null;
        }
        var arg = this.parent.evalExpression(exp.args[0], scope);
        if(arg.hasOwnProperty("length")){
            return {type:"int",value: arg.length};
        }
        this.parent.die("`length` does not accept arguments of type `" + arg.type + "`.");  
    }
    plot(exp, scope){
        if(exp.args.length != 2){
            this.parent.die("`plot` only takes an x and a y vector for now.");
        }
        var x = this.parent.evalExpression(exp.args[0], scope);
        var y = this.parent.evalExpression(exp.args[1], scope);
        if(x.type != "vector" || y.type != "vector"){
            this.parent.die("`plot` must be passed vector arguments");
        }
        var x_arr = [];
        var y_arr = [];
        console.log(x);
        for(var i = 0; i < x.length; i++){
            x_arr.push(x.value[i].value);
            y_arr.push(y.value[i].value);
        }
        this.parent.out.plot(x_arr,y_arr,"test");
    }
}

