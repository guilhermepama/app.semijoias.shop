// Rota para editar produtos
app.post('/editar', function(req, res){

    // Obter os dados do formulario
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;
    let dataEnvio = Date.now();
    

    // Validar nome do produto e valor
    if(nome == '' || valor == '' || isNaN(valor)){
        res.redirect('/falhaEdicao');
        return;
    }
        // Definir o tipo de edição
        try {
            // Objeto de imagem
            let imagem = req.files && req.files.imagem ? req.files.imagem : null;
                if (!imagem) {
                    console.log('Nenhuma nova imagem enviada.');
                }
            // SQL
            let sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${imagem.name}' WHERE codigo=${codigo}`;

            // Executar comando SQL
            conexao.query(sql, function(erro, retorno) {
                if (erro) throw erro;

                // Remover imagem antiga
                const caminhoAntigo = __dirname + '/imagens/' + nomeImagem;
                fs.unlink(caminhoAntigo, (erro_imagem) => {
                    if (erro_imagem) {
                        console.log('Falha ao remover a imagem antiga:', erro_imagem.message);
                    } else {
                        console.log('Imagem antiga removida com sucesso.');
                    }
                });

                // Cadastrar nova imagem
                let extensao = imagem.name.split('.').pop();
                let nomeBase = imagem.name.replace(`.${extensao}`, '');
                const caminhoNovo = `${__dirname}/imagens/${nomeBase}_${dataEnvio}.${extensao}`;
                imagem.mv(caminhoNovo, (erro_mv) => {
                    if (erro_mv) {
                        console.log('Falha ao mover a nova imagem:', erro_mv.message);
                    } else {
                        console.log('Nova imagem cadastrada com sucesso.');
                        res.redirect('/okEdicao');
                    }
                });
            });
        } catch (erro) {
        console.log('Erro durante a edição:', erro.message);

        // SQL sem imagem
        let sql = `UPDATE produtos SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;
        conexao.query(sql, function(erro, retorno) {
            if (erro) throw erro;
            console.log('Produto atualizado sem alteração de imagem.');
            res.redirect('/');
        });
    }
});



// Rota de Cadastro
app.post('/cadastrar', function(req, res){
    try{
    //Obter os dados que serão utilizados para o cadastro
    let nome = req.body.nome;
    let valor = req.body.valor;
    let imagem = req.files && req.files.imagem ? req.files.imagem.name : null;

    if (!imagem) {
        throw new Error('Nenhuma imagem envida.')
    }
    
    //SQL
    let sql = `INSERT INTO produtos (nome, valor, imagem) VALUES ('${nome}', ${valor}, '${imagem}')`;

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        //Caso ocorra algum erro
        if(erro) throw erro;

        //Caso ocorra o cadastro
        
        req.files.imagem.mv(__dirname+'/imagens/'+req.files.imagem.name, (erro_mv)=> {
            if (erro_mv) {
                console.log('Erro ao mover imagem:', erro_mv.message);
                throw erro_mv;
            }
            console.log('Imagem cadastrada com sucesso!');
        });
    });
        // Retornar para a rota principal
        res.redirect('/okCadastro');
    } catch(erro){
        console.error('Erro durante o cadastro:', erro.message);
        res.redirect('/falhaCadastro');
    } 
});