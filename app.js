// Importar módulo express
const express = require('express');

// Importar módulo fileupload
const fileupload = require('express-fileupload')

// Importar módulo express-handlebars
const { engine } = require('express-handlebars');

// Importar módulo mysql
const mysql = require('mysql2');

// File Systems
const fs = require('fs');

//App
const app = express();

// Habilitando o Fileupload
app.use(fileupload());

// Adicionar Bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// Adicionar CSS
app.use('/css', express.static('./css'));

// Referenciar pasta imagens
app.use('/imagens', express.static('./imagens'));

// Configuração do express-handlebars
app.engine('handlebars', engine({
    helpers: {
      // Função auxiliar para verificar igualdade
      condicionalIgualdade: function (parametro1, parametro2, options) {
        return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
      }
    }
  }));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Configuração de conexão
const conexao = mysql.createConnection({
    host: '62.72.63.129',
    user: 'app_user',
    password: 'user@Gsp1207',
    database: 'sql_ecmjoias_com'
});

// Teste de conexão
conexao.connect(function(erro){
    if(erro) throw erro;
    console.log('Conexão efetuda com sucesso');
});

// Rota principal
app.get('/', function(req, res){

    // SQL
    let sql = 'SELECT * FROM produtos';

    //Executar comando SQL
    conexao.query(sql, function(erro, retorno) {
        res.render('formulario', {produtos:retorno});

    });
});

// Rota principal contendo a situação
app.get('/:situacao', function(req, res){

    // SQL
    let sql = 'SELECT * FROM produtos';

    //Executar comando SQL
    conexao.query(sql, function(erro, retorno) {
        res.render('formulario', {produtos:retorno, situacao:req.params.situacao});

    });
});

// Rota de Cadastro
app.post('/cadastrar', function (req, res) {
    try {
        // Obter os dados do formulário
        let nome = req.body.nome;
        let valor = req.body.valor;

        // Verificar se a imagem foi enviada
        let imagem = req.files && req.files.imagem ? req.files.imagem : null;

        if (!imagem) {
            throw new Error('Nenhuma imagem enviada.');
        }

        // Renomear a imagem com timestamp
        let dataEnvio = Date.now(); // Cria um timestamp único
        let extensao = imagem.name.split('.').pop(); // Pega a extensão do arquivo
        let nomeImagem = `produto_${dataEnvio}.${extensao}`; // Nome único para a imagem

        // Caminho para salvar a imagem
        const caminho = `${__dirname}/imagens/${nomeImagem}`;

        // SQL para inserir no banco
        let sql = `INSERT INTO produtos (nome, valor, imagem) VALUES ('${nome}', ${valor}, '${nomeImagem}')`;

        // Executar comando SQL
        conexao.query(sql, function (erro, retorno) {
            if (erro) {
                console.error('Erro ao inserir no banco de dados:', erro.message);
                res.redirect('/falhaCadastro');
                return;
            }

            // Mover a imagem com o novo nome
            imagem.mv(caminho, (erro_mv) => {
                if (erro_mv) {
                    console.error('Erro ao mover imagem:', erro_mv.message);
                    res.redirect('/falhaCadastro');
                    return;
                }

                console.log('Produto e imagem cadastrados com sucesso!');
                res.redirect('/okCadastro');
            });
        });
    } catch (erro) {
        console.error('Erro durante o cadastro:', erro.message);
        res.redirect('/falhaCadastro');
    }
});


// Rota para remover produtos
app.get('/remover/:codigo&:imagem', function(req, res){
    
    // Tratamento de exceçãp
    try {
    //SQL
    let sql = `DELETE FROM produtos WHERE codigo = ?`;

    // Executar o comando SQL
    conexao.query(sql, [req.params.codigo], function (erro, retorno) {
        // Caso falhe o comando SQL
        if (erro) throw erro;

        // Caso o comando SQL funcione
        fs.unlink(__dirname + '/imagens/' + req.params.imagem, (erro_imagem) => {
            if (erro_imagem) console.log('Falha ao remover imagem:', erro_imagem.message);
        });
    } );

    // Redirecionamento
    res.redirect('/okRemover');
    }catch(erro) {
        res.redirect('/falhaRemover')
    }
});

// Rota para redirecionar o formulário de alteração/edição
app.get('/formularioEditar/:codigo', function(req, res){
    
    //SQL
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;

    //Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        // Caso falhe no comando
        if(erro) throw erro;

        // Caso tenha sucesso
        res.render('formularioEditar', {produto:retorno[0]});

    });
});

// Rota para editar produtos
app.post('/editar', function(req, res) {
    // Obter os dados do formulário
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;
    let dataEnvio = Date.now();

    // Validar nome do produto e valor
    if (nome == '' || valor == '' || isNaN(valor)) {
        res.redirect('/falhaEdicao');
        return;
    }

    // Verificar se uma nova imagem foi enviada
    let imagem = req.files && req.files.imagem ? req.files.imagem : null;

    // SQL base
    let sql;

    if (imagem) {
        // Gerar um nome único para a imagem
        let extensao = imagem.name.split('.').pop(); // Pega a extensão
        let nomeBase = imagem.name.replace(`.${extensao}`, '');
        const novoNomeImagem = `${nomeBase}_${dataEnvio}.${extensao}`;

        // Atualizar SQL com imagem
        sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${novoNomeImagem}' WHERE codigo=${codigo}`;

        // Executar comando SQL
        conexao.query(sql, function(erro, retorno) {
            if (erro) {
                console.log('Erro no SQL:', erro.message);
                res.redirect('/falhaEdicao');
                return;
            }

            // Remover imagem antiga
            const caminhoAntigo = `${__dirname}/imagens/${nomeImagem}`;
            fs.unlink(caminhoAntigo, (erro_imagem) => {
                if (erro_imagem) console.log('Falha ao remover imagem antiga:', erro_imagem.message);
            });

            // Mover nova imagem
            const caminhoNovo = `${__dirname}/imagens/${novoNomeImagem}`;
            imagem.mv(caminhoNovo, (erro_mv) => {
                if (erro_mv) {
                    console.log('Falha ao mover nova imagem:', erro_mv.message);
                    res.redirect('/falhaEdicao');
                } else {
                    console.log('Nova imagem cadastrada com sucesso.');
                    res.redirect('/okEdicao');
                }
            });
        });
    } else {
        // SQL sem imagem
        sql = `UPDATE produtos SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;

        conexao.query(sql, function(erro, retorno) {
            if (erro) {
                console.log('Erro no SQL:', erro.message);
                res.redirect('/falhaEdicao');
            } else {
                console.log('Produto atualizado sem alteração de imagem.');
                res.redirect('/okEdicao');
            }
        });
    }
});

// Servidor
app.listen(8080);