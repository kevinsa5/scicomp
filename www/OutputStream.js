class OutputStream {
    contstructor(){

    }
    setTarget(output){
        this.output = output;
        this.clear();
    }
    print(str){
        this.output.text(this.output.text() + str);
        this.output.scrollTop(this.output.prop("scrollHeight"));
    }
    println(str){
        this.print(str + "\n");
    }
    clear(){
        this.output.text("");
    }
}
