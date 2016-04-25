importScripts('https://cdnjs.cloudflare.com/ajax/libs/mathjs/2.7.0/math.min.js', 'CharacterStream.js', 'TokenStream.js', 'ASTStream.js', 'Scope.js', 'Builtins.js', 'Interpreter.js');

class OutputStream {
    constructor(){
        this.buffer = "";
        this.bufferTime = 0;
    }
    flush(){
        postMessage(this.buffer);
        this.bufferTime = Date.now();
        this.buffer = "";
    }
    print(str){
        this.buffer += str;
        if(Date.now() - this.bufferTime > 100){
            this.flush();
        }
    }
    println(str){
        this.print(str + "\n");
    }
}

addEventListener('message', function(e){
    var info = e.data;
    var out = new OutputStream();

    if(info.command == "execute"){
        var ast = new AST(new TokenStream(new CharacterStream(info.data)));
        var interpreter = new Interpreter(ast, out);
        interpreter.run();
    } else if(info.command == "AST"){
        var ast = new AST(new TokenStream(new CharacterStream(info.data)));
        while(!ast.empty()){
            try{
                var exp = ast.next();
                out.println(JSON.stringify(exp, null, '\t'));
                out.println("~~~~~~~~~~~~~~~~~");
            } catch(e){
                out.println(e);
            }
        }
    } else if(info.command == "tokenize"){
        var tokenizer = new TokenStream(new CharacterStream(info.data));
        while(!tokenizer.empty()){
            try {
                var tok = tokenizer.next();
                out.println(tok.type + ":" + tok.value);
            } catch(e){
                console.log(e);
                out.println(e);
                return;
            }
        }
    }
    out.flush();
    close();
}, false);
