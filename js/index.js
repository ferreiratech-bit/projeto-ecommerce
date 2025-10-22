// Seletores
const botoesAdicionar = document.querySelectorAll('.adicionar-ao-carrinho');
const contadorCarrinho = document.getElementById('contador-carrinho');
const tabelaCarrinho = document.querySelector('#modal-1-content tbody');
const totalCarrinho = document.getElementById('total-carrinho');

// Função para obter o carrinho do localStorage
function getCarrinho() {
    return JSON.parse(localStorage.getItem('carrinho')) || [];
}

// Função para salvar o carrinho no localStorage
function setCarrinho(carrinho) {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Atualiza o contador do carrinho
function atualizarContador() {
    const carrinho = getCarrinho();
    const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    contadorCarrinho.textContent = total;
}

// Atualiza o HTML do carrinho no modal
function atualizarCarrinho() {
    const carrinho = getCarrinho();
    tabelaCarrinho.innerHTML = '';
    let total = 0;
    carrinho.forEach(item => {
        total += item.preco * item.quantidade;
        tabelaCarrinho.innerHTML += `
            <tr>
                <td class="td-produto"><img src="${item.imagem}" alt="${item.nome}"></td>
                <td>${item.nome}</td>
                <td class="td-preco-unitario">R$ ${item.preco.toFixed(2)}</td>
                <td class="td-quantidade">${item.quantidade}</td>
                <td class="td-preco-total">R$ ${(item.preco * item.quantidade).toFixed(2)}</td>
                <td><button class="btn-remover" data-nome="${item.nome}" title="Remover">✖</button></td>
            </tr>
        `;
    });
    totalCarrinho.textContent = `Total: R$ ${total.toFixed(2)}`;
    atualizarContador();
}

// OBJETIVO 1: Adicionar produto ao carrinho
botoesAdicionar.forEach(botao => {
    botao.addEventListener('click', function() {
        const produto = this.closest('.produto');
        const nome = produto.querySelector('figcaption').textContent.trim();
        const imagem = produto.querySelector('img').src;
        const preco = Number(produto.querySelector('.preco').textContent.replace('R$', '').replace(',', '.').trim());
        let carrinho = getCarrinho();
        const existente = carrinho.find(item => item.nome === nome);
        if (existente) {
            existente.quantidade += 1;
        } else {
            carrinho.push({ nome, imagem, preco, quantidade: 1 });
        }
        setCarrinho(carrinho);
        atualizarCarrinho();
    });
});

// OBJETIVO 2: Remover produto do carrinho
tabelaCarrinho.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-remover')) {
        const nome = e.target.getAttribute('data-nome');
        let carrinho = getCarrinho();
        carrinho = carrinho.filter(item => item.nome !== nome);
        setCarrinho(carrinho);
        atualizarCarrinho();
    }
});

// OBJETIVO 3: Atualizar valores do carrinho (já incluso nas funções acima)

// Inicializa ao carregar a página
atualizarCarrinho();