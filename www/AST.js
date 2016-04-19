class AST {
    constructor(tokenstream){
        this.tokenstream = tokenstream;
        this.PRECEDENCE = {
            "=": 1,
            "||": 2,
            "&&": 3,
            "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
            "+": 10, "-": 10,
            "*": 20, "/": 20, "%": 20,
        };
    }
    
    generate(){
        var body = [];
        while(!this.tokenstream.empty()){
            body.push(this.parseExpression());
            if(!this.tokenstream.empty()){
                this.skipPunctuation(";");
            }
        }
        return {type:"body", body: body};
    }

    isPunctuation(ch) {
        var tok =  this.tokenstream.peek();
        return tok.type == "punctuation" && (!ch || tok.value == ch) && tok;
    }
    isReserved(reserved) {
        var tok =  this.tokenstream.peek();
        return tok.type == "reserved" && (!reserved || tok.value == reserved) && tok;
    }
    isOperator(operator) {
        var tok =  this.tokenstream.peek();
        return tok.type == "operator" && (!operator || tok.value == operator) && tok;
    }
    skipPunctuation(ch) {
        var tok = new Token("punctuation", ch);
        this.skipToken(tok);
    }
    skipReserved(reserved) {
        var tok = new Token("reserved", reserved);
        this.skipToken(tok);
    }
    skipOperator(op) {
        var tok = new Token("operator", op);
        this.skipToken(tok);
    }
    
    skipToken(token){
        var other = this.tokenstream.peek();
        if(other.type == token.type && other.value == token.value){
            this.tokenstream.next();
        } else {
            this.die("Expected token of type " + token.type + " with value " + token.value + ".  Found token of type " + other.type + " with value " + other.value);
        }
    }
    
    maybeBinary(left, my_prec) {
        var tok = this.isOperator();
        if (tok) {
            tok = this.tokenstream.peek();
            var his_prec = this.PRECEDENCE[tok.value];
            if (his_prec > my_prec) {
                this.tokenstream.next();
                return this.maybeBinary({
                    type     : tok.value == "=" ? "assign" : "binary",
                    operator : tok.value,
                    left     : left,
                    right    : this.maybeBinary(this.parseAtom(), his_prec)
                }, my_prec);
            }
        }
        return left;
    }
    delimited(start, stop, separator, parser) {
        var a = [], first = true;
        this.skipPunctuation(start);
        while (! this.tokenstream.empty()) {
            if (this.isPunctuation(stop)) break;
            if (first) first = false; else this.skipPunctuation(separator);
            if (this.isPunctuation(stop)) break;
            a.push(parser());
        }
        this.skipPunctuation(stop);
        return a;
    }
    parseFunctionEval(func) {
        return {
            type: "funceval",
            func: func,
            args: this.delimited("(", ")", ",", (this.parseExpression).bind(this)),
        };
    }
    parseVarname() {
        var name = this.tokenstream.next();
        if (name.type != "symbol")  this.tokenstream.die("Expecting symbol name");
        return name.value;
    }
    parseIf() {
        this.skipReserved("if");
        var cond = this.parseExpression();
        if (!this.isPunctuation("{")) this.skipReserved("then");
        var then = this.parseExpression();
        var ret = {
            type: "if",
            cond: cond,
            then: then,
        };
        if (this.isReserved("else")) {
            this.tokenstream.next();
            ret.else = this.parseExpression();
        }
        return ret;
    }
    parseLambda() {
        return {
            type: "lambda",
            vars: this.delimited("(", ")", ",", (this.parseVarname).bind(this)),
            body: this.parseExpression()
        };
    }
    parseBool() {
        return {
            type  : "bool",
            value :  this.tokenstream.next().value == "true"
        };
    }
    maybeCall(expr) {
        expr = expr();
        return this.isPunctuation("(") ? this.parseFunctionEval(expr) : expr;
    }
    parseAtom() {
	var ast = this;
        return this.maybeCall(function(){
            if (ast.isPunctuation("(")) {
                ast.tokenstream.next();
                var exp = ast.parseExpression();
                ast.skipPunctuation(")");
                return exp;
            }
            if (ast.isPunctuation("{")) return ast.parseProg();
            if (ast.isReserved("if")) return ast.parseIf();
            if (ast.isReserved("true") || ast.isReserved("false")) return ast.parseBool();
            if (ast.isReserved("lambda")) {
                ast.tokenstream.next();
                return ast.parseLambda();
            }
            var tok = ast.tokenstream.next();
            if (tok.type == "symbol" || tok.type == "int" || tok.type == "float" || tok.type == "string")
                return tok;
            ast.die("Unexpected token of type: " + tok.type + " and value: " + tok.value);
        });
    }
    parseProg() {
        var prog = this.delimited("{", "}", ";", (this.parseExpression).bind(this));
        if (prog.length == 0) return null;
        if (prog.length == 1) return prog[0];
        return { type: "prog", prog: prog };
    }
    parseExpression() {
        var ast = this;
        return ast.maybeCall((function(){
            return ast.maybeBinary(ast.parseAtom(), 0);
        }).bind(this));
    }
    die(msg){
        throw new Error("Syntax Error: Line " + this.tokenstream.charstream.line + " : " + msg);
    }
}

