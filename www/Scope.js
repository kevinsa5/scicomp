class Scope {
    constructor(parent){
        this.parent = parent;
        this.vars = {};
    }
    addSymbol(sym, value){
        this.vars[sym.value] = value;
    }
    find(sym){
        if(this.vars.hasOwnProperty(sym.value)){
            return this.vars[sym.value];
        } else if(this.parent){
            return this.parent.find(sym);
        }
        this.die("No such symbol: " + sym.value);
    }
    die(msg){
        throw new Error("Scope Error: " + msg);
    }
}
