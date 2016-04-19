class CharacterStream {
    constructor(source){
        this.source = source;
        this.line = 1;
        this.col = 1;
        this.pos = 0;
    }
    next() {
        if(this.empty()) return "";
        var character = this.source.charAt(this.pos);
        this.pos += 1;
        if(character == "\n"){
            this.line += 1;
            this.col = 1;
        } else {
            this.col += 1;
        }
        return character;
    }
    empty() {
        return this.pos >= this.source.length;
    }
    peek() {
        if(this.empty()) return "";
        return this.source.charAt(this.pos);
    }
}


