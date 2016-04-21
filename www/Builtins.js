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
}

