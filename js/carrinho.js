/*
Objetivos: adicionar, remover e atualizar produtos no carrinho
*/
if (window.__carrinho_iniciado) {
    console.warn('carrinho.js já inicializado');
} else {
    window.__carrinho_iniciado = true;

    // inicializa micromodal se disponível
    if (window.MicroModal) {
        MicroModal.init();
    }

    const botoesAdicionarAoCarrinho = document.querySelectorAll('.adicionar-ao-carrinho');
    const tbodyCarrinho = document.getElementById('tabela-carrinho');
    const totalCarrinhoEl = document.getElementById('total-carrinho');

    if (!tbodyCarrinho) {
        console.warn('Tabela do carrinho (tbody#tabela-carrinho) não encontrada no DOM.');
    } else {
        console.log('tbody do carrinho encontrado:', tbodyCarrinho);
    }

    botoesAdicionarAoCarrinho.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            const elementoProduto = evento.target.closest('.produto');
            if (!elementoProduto) return;

            const produtoId = String(elementoProduto.dataset.id || elementoProduto.querySelector('.nome')?.textContent || '').trim();
            const produtoNome = elementoProduto.querySelector('.nome')?.textContent?.trim() || '';
            const produtoImagem = elementoProduto.querySelector('img')?.getAttribute('src') || '';
            const precoTexto = elementoProduto.querySelector('.preco')?.textContent || '0';
            const produtoPreco = parseFloat(precoTexto.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;

            const carrinho = obterProdutosDoCarrinho();
            const existeProduto = carrinho.find(p => String(p.id) === produtoId);

            if (existeProduto) {
                existeProduto.quantidade = (existeProduto.quantidade || 0) + 1;
            } else {
                carrinho.push({
                    id: produtoId,
                    nome: produtoNome,
                    imagem: produtoImagem,
                    preco: produtoPreco,
                    quantidade: 1
                });
            }

            salvarProdutosNoCarrinho(carrinho);
            atualizarContadorDoCarrinho();
            renderizarTabelaDoCarrinho();

            // abrir o modal do carrinho ao adicionar um item (com callbacks para permitir cliques na página)
            if (window.MicroModal) {
                MicroModal.show('modal-1', {
                    onShow: (modal) => {
                        const overlay = modal.firstElementChild; // o div de overlay
                        if (overlay) overlay.style.pointerEvents = 'none';
                        const container = modal.querySelector('.container');
                        if (container) {
                            container.style.pointerEvents = 'auto';
                            container.style.zIndex = '1000';
                        }
                    },
                    onClose: (modal) => {
                        const overlay = modal.firstElementChild;
                        if (overlay) overlay.style.pointerEvents = '';
                        const container = modal.querySelector('.container');
                        if (container) {
                            container.style.pointerEvents = '';
                            container.style.zIndex = '';
                        }
                    }
                });
            }
        });
    });

    function salvarProdutosNoCarrinho(carrinho) {
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
    }

    function obterProdutosDoCarrinho() {
        const produtos = localStorage.getItem('carrinho');
        return produtos ? JSON.parse(produtos) : [];
    }

    function atualizarContadorDoCarrinho() {
        const carrinho = obterProdutosDoCarrinho();
        const total = carrinho.reduce((soma, produto) => soma + (produto.quantidade || 0), 0);
        const el = document.getElementById("contador-carrinho");
        if (el) el.textContent = total;
    }

    function formatarPreco(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }

    function renderizarTabelaDoCarrinho() {
        if (!tbodyCarrinho) return;
        const carrinho = obterProdutosDoCarrinho();
        tbodyCarrinho.innerHTML = '';

        carrinho.forEach(item => {
            const tr = document.createElement('tr');

            // Produto (imagem)
            const tdProduto = document.createElement('td');
            tdProduto.className = 'td-produto';
            const img = document.createElement('img');
            img.src = item.imagem || '';
            img.alt = item.nome || '';
            img.style.cursor = 'pointer';

            // abrir lightbox ao clicar (substitui window.open)
            img.addEventListener('click', () => {
                abrirLightbox(item.imagem, item.nome);
            });

            tdProduto.appendChild(img);

            // Descrição / nome
            const tdDescricao = document.createElement('td');
            tdDescricao.textContent = item.nome || '';

            // Preço unitário
            const tdPrecoUnit = document.createElement('td');
            tdPrecoUnit.className = 'td-preco-unitario';
            tdPrecoUnit.textContent = formatarPreco(item.preco || 0);

            // Quantidade (input)
            const tdQuantidade = document.createElement('td');
            tdQuantidade.className = 'td-quantidade';
            const inputQtd = document.createElement('input');
            inputQtd.type = 'number';
            inputQtd.min = '1';
            inputQtd.value = item.quantidade || 1;
            inputQtd.dataset.id = item.id;
            inputQtd.addEventListener('change', (e) => {
                const novaQtd = parseInt(e.target.value, 10);
                if (isNaN(novaQtd) || novaQtd < 1) {
                    e.target.value = item.quantidade;
                    return;
                }
                atualizarQuantidade(item.id, novaQtd);
            });
            tdQuantidade.appendChild(inputQtd);

            // Preço total do item
            const tdPrecoTotal = document.createElement('td');
            tdPrecoTotal.className = 'td-preco-total';
            tdPrecoTotal.textContent = formatarPreco((item.preco || 0) * (item.quantidade || 1));
            tdPrecoTotal.dataset.id = item.id;

            // Botão remover
            const tdRemover = document.createElement('td');
            const btnRemover = document.createElement('button');
            btnRemover.type = 'button';
            btnRemover.className = 'btn-remover';
            btnRemover.dataset.id = item.id;
            btnRemover.setAttribute('aria-label', `Remover ${item.nome}`);
            btnRemover.textContent = 'Remover';
            btnRemover.addEventListener('click', () => {
                removerProduto(item.id);
            });
            tdRemover.appendChild(btnRemover);

            tr.appendChild(tdProduto);
            tr.appendChild(tdDescricao);
            tr.appendChild(tdPrecoUnit);
            tr.appendChild(tdQuantidade);
            tr.appendChild(tdPrecoTotal);
            tr.appendChild(tdRemover);

            tbodyCarrinho.appendChild(tr);
        });

        atualizarTotalGeral();
    }

    // lightbox simples
    function criarLightbox() {
        if (document.getElementById('lightbox')) return;
        const lb = document.createElement('div');
        lb.id = 'lightbox';
        lb.innerHTML = `
            <div class="lb-backdrop" tabindex="-1">
                <div class="lb-content">
                    <button class="lb-close" aria-label="Fechar">✕</button>
                    <img class="lb-img" src="" alt="">
                </div>
            </div>
        `;
        document.body.appendChild(lb);

        lb.querySelector('.lb-close').addEventListener('click', fecharLightbox);
        lb.addEventListener('click', (e) => {
            if (e.target === lb || e.target.classList.contains('lb-backdrop')) fecharLightbox();
        });
    }

    function abrirLightbox(src, alt = '') {
        criarLightbox();
        const lb = document.getElementById('lightbox');
        const img = lb.querySelector('.lb-img');
        img.src = src || '';
        img.alt = alt || '';
        lb.classList.add('open');
    }

    function fecharLightbox() {
        const lb = document.getElementById('lightbox');
        if (!lb) return;
        lb.classList.remove('open');
        const img = lb.querySelector('.lb-img');
        if (img) img.src = '';
    }

    function atualizarQuantidade(id, quantidade) {
        const carrinho = obterProdutosDoCarrinho();
        const idx = carrinho.findIndex(p => String(p.id) === String(id));
        if (idx === -1) return;
        carrinho[idx].quantidade = quantidade;
        salvarProdutosNoCarrinho(carrinho);
        renderizarTabelaDoCarrinho();
        atualizarContadorDoCarrinho();
    }

    function removerProduto(id) {
        let carrinho = obterProdutosDoCarrinho();
        carrinho = carrinho.filter(p => String(p.id) !== String(id));
        salvarProdutosNoCarrinho(carrinho);
        renderizarTabelaDoCarrinho();
        atualizarContadorDoCarrinho();
    }

    function atualizarTotalGeral() {
        const carrinho = obterProdutosDoCarrinho();
        const total = carrinho.reduce((soma, produto) => soma + ((produto.preco || 0) * (produto.quantidade || 0)), 0);
        if (totalCarrinhoEl) totalCarrinhoEl.textContent = `Total: ${formatarPreco(total)}`;
    }

    // inicializa render e contador na carga
    renderizarTabelaDoCarrinho();
    atualizarContadorDoCarrinho();

    // expõe funções para testar manualmente no console (temporário)
    window.__debugCarrinho = {
        obterProdutos: () => JSON.parse(localStorage.getItem('carrinho') || '[]'),
        limparCarrinho: () => { localStorage.removeItem('carrinho'); console.log('carrinho limpo'); },
        // renderizarTabelaDoCarrinho e atualizarContador são definidos mais abaixo; serão expostos quando existirem
    };
}