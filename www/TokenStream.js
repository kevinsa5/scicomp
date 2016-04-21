class Token {
    constructor(type, value){
        this.type = type;
        this.value = value;
    }
}

class TokenStream {
    constructor(charstream){
        this.charstream = charstream;
        this.latest = null;
    }
    next(){
        var temp = this.latest;
        this.latest = null;
        return temp || this.getNext();
    }
    empty(){
        return this.peek() == null;
    }
    getNext(){
        this.readUntil(function(char){return !TokenStream.isWhitespace(char);});
        if(this.charstream.empty()) return null;
        var char = this.charstream.peek();
        if(char == '"'){
            this.charstream.next();
            s = this.readUntil(function(char){return char == '"';});
            if(this.charstream.peek() != '"'){
                this.die("Unterminated string literal");
            }
            this.charstream.next();
            return new Token("string", s);
        }
        if(char == "#"){
            this.readUntil(function(char){return char == "\n"});
            this.charstream.next();
            return this.getNext();
        }
        if(TokenStream.isDigit(char)){
            var numDots = 0;
            var s = this.readUntil(function(char){return !(TokenStream.isDigit(char) || (char == "." && numDots++ == 0)); });
            if(numDots == 0){
                return new Token("int", parseInt(s));
            } else {
                return new Token("float", parseFloat(s));
            }
        }
	char = this.charstream.next();
        if(TokenStream.isPunctuation(char)){
            return new Token("punctuation", char);
        }
        if(TokenStream.isDoubleCharOperator(char+this.charstream.peek())){
            var s = char + this.charstream.next();
            return new Token("operator", s);
        }
        if(TokenStream.isSingleCharOperator(char)){
            return new Token("operator", char);
        }
        if(TokenStream.isValidSymbolBeginner(char)){
            var s = char + this.readUntil(function(char){return !TokenStream.isValidSymbolCharacter(char);});
            if(TokenStream.isReservedWord(s)){
		if(s == "true" || s == "false")
		    return new Token("boolean", s);
		return new Token("reserved", s);
	    }
            return new Token("symbol", s);
        }
        this.die("Unknown token: `" + char + "`");
    }
    peek(){
        if(!this.latest) this.latest = this.getNext();
        return this.latest;
    }
    readUntil(func){
        var str = "";
        while(!this.charstream.empty() && !func(this.charstream.peek())){
            str += this.charstream.next();
        }
        return str;
    }
    static isWhitespace(char){
        return " \r\n\t".indexOf(char) != -1;
    }
    static isDigit(char){
        return /[0-9]/i.test(char);
    }
    static isPunctuation(char) {
        return ",;(){}[]".indexOf(char) != -1;
    }
    static isValidSymbolBeginner(char){
        return /[a-zA-Z]/i.test(char);
    }
    static isValidSymbolCharacter(char){
        return /[a-zA-Z0-9]/i.test(char);
    }
    static isReservedWord(word){
        return ["if", "then", "else", "for", "while", "true", "false", "function", "lambda", "return"].indexOf(word) != -1;
    }
    static isSingleCharOperator(char){
        return "!%^*/+-<>=:".indexOf(char) != -1;
    }
    static isDoubleCharOperator(op){
        var ops = ["||", "&&", "==", "!=", "<=", ">=", "in"];
        for(var i = 0; i < ops.length; i++){
            if(ops[i] == op) return true;
        }
        return false;
    }
    die(msg){
        throw new Error("Tokenizer Error: Line " + this.charstream.line + ": " + msg);
    }
}

