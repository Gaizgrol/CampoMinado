class Jogo
{
    static JOGANDO    = 0;
    static VITORIA    = 1;
    static DERROTA    = 2;
    static ABRINDO    = 3;
    static EXPLODINDO = 4;

    constructor( largura, altura, bombas )
    {
        this.largura = largura;
        this.altura = altura;

        this.bombas = bombas;

        this.estado = Jogo.JOGANDO;
        
        /**@type {Bloco[]} */
        this.blocos = [];
        this.blocosFechados = 0;

        this.iniciar();
    }

    abre( x, y )
    {
        // Caso esteja em jogo
        if ( this.estado == Jogo.JOGANDO )
        {
            let bloco = this.buscaBloco( x, y );
            
            // Caso o bloco exista e não tenha sido aberto
            if ( bloco && bloco.estado == Bloco.FECHADO && !bloco.temBandeira )
            {
                bloco.abre();
                this.blocosFechados--;

                if ( bloco.temMina )
                {
                    this.perde();
                    setTimeout(() => { this.explode( x, y ); }, 450);
                    return;
                }
                else if ( bloco.minasEmVolta == 0 )
                {
                    this.abre( x-1, y-1 );
                    this.abre( x, y-1 );
                    this.abre( x+1, y-1 );

                    this.abre( x-1, y );
                    this.abre( x+1, y );
                    
                    this.abre( x-1, y+1 );
                    this.abre( x, y+1 );
                    this.abre( x+1, y+1 );
                }

                if ( this.blocosFechados == this.bombas )
                {
                    this.ganha();
                    return;
                }
            }
        }
    }

    buscaBloco( x, y )
    {
        if ( x >= 0 && x < this.largura && y >= 0 && y < this.altura )
            return this.blocos[ y * this.largura + x ];
        return null;
    }

    calculaNumeros()
    {
        // Calcula quantas minas têm em volta do bloco
        for ( let bloco of this.blocos )
        {
            let minasEmVolta = 0;

            // Olha os vizinhos
            for ( let vy = bloco.y-1; vy <= bloco.y+1; vy++ )
            {
                for ( let vx = bloco.x-1; vx <= bloco.x+1; vx++ )
                {
                    // Vizinho não pode ter a mesma coordenada que a minha
                    if ( vx != bloco.x || vy != bloco.y )
                    {
                        // Se é um vizinho válido e ele tem uma mina enterrada
                        let vizinho = this.buscaBloco( vx, vy );
                        if ( vizinho && vizinho.temMina )
                            minasEmVolta++;
                    }
                }
            }

            bloco.atualizaMinasEmVolta( minasEmVolta );
            bloco.atualizaEstado();
        }
    }

    criaTabela()
    {
        // Limpa o campo
        let tabela = document.getElementById("campo");
        tabela.innerHTML = "";

        // Popula o campo
        for ( let y=0; y<this.altura; y++ )
        {
            // Cria as linhas
            let linha = document.createElement("tr");
            for ( let x=0; x<this.largura; x++ )
            {
                // Cria as colunas
                let bloco = new Bloco( x, y );
                bloco.elemento.addEventListener("click", () => {
                    this.abre( x, y );
                });
                bloco.elemento.addEventListener("contextmenu", (event) => {
                    if ( bloco.estado == Bloco.FECHADO )
                    {
                        event.preventDefault();
                        bloco.bandeira();
                    }
                });

                this.blocos.push( bloco );
                linha.appendChild( bloco.elemento );
            }
            tabela.appendChild(linha);
        }

        this.blocosFechados = this.blocos.length;
    }

    enterraMinas()
    {
        // Enterra as minas no campo
        for ( let m=0; m<this.bombas; m++ )
        {
            let mx, my, bloco;
            do
            {
                mx = Math.round( Math.random() * (this.largura-1) );
                my = Math.round( Math.random() * (this.altura-1) );
                bloco = this.buscaBloco( mx, my );
            }
            while ( bloco.temMina );

            bloco.temMina = true;
        }
    }

    explode( x, y )
    {
        let bloco = this.buscaBloco( x, y );
        if ( bloco && bloco.estado != Bloco.QUEIMADO && bloco.estado != Bloco.EXPLOSAO )
        {
            bloco.atualizaEstado( Bloco.EXPLOSAO )

            setTimeout(() =>
            {
                if ( bloco.temMina )
                    for ( let ey = y-2; ey <= y+2; ey++ )
                        for ( let ex = x-2; ex <= x+2; ex++ )
                            this.explode( ex, ey );
            }, 150);

            setTimeout(() =>
            {
                bloco.atualizaEstado( Bloco.QUEIMADO );

                this.explode( x-1, y );
                this.explode( x+1, y );
                this.explode( x, y-1 );
                this.explode( x, y+1 );
            }, 300);
        }
    }

    ganha()
    {
        this.estado = Jogo.VITORIA;
        for ( let bloco of this.blocos )
        {
            if ( bloco.temMina )
                bloco.atualizaEstado( Bloco.SOLUCIONADO );
        }
    }
    
    iniciar()
    {
        this.criaTabela();
        this.enterraMinas();
        this.calculaNumeros();
    }

    perde()
    {
        this.estado = Jogo.DERROTA;
    }
}

class Bloco
{
    static ABERTO = 0;
    static FECHADO = 1;
    static SOLUCIONADO = 2;
    static EXPLOSAO = 3;
    static QUEIMADO = 4;

    static CORES =
    [
        "#FFFFFF", // 0 -> Não utilizada
        "#7070FF", // 1
        "#008000", // 2
        "#FF0000", // 3
        "#00008b", // 4
        "#8b0000", // 5
        "#008b8b", // 6
        "#000000", // 7
        "#808080"  // 8
    ]

    constructor( x, y )
    {
        this.x = x;
        this.y = y;
        this.temMina = false;
        this.temBandeira = false;
        this.estado = Bloco.FECHADO;
        this.elemento = this.criaElemento();
        this.minasEmVolta = 0;
        
        this.atualizaEstado();
    }

    abre()
    {
        this.estado = Bloco.ABERTO;
        this.atualizaEstado();
    }

    atualizaEstado( estado = this.estado )
    {
        this.estado = estado;

        switch ( estado )
        {
            case Bloco.ABERTO:
                this.elemento.className = this.temMina ? "mina" : "aberto";
                break;

            case Bloco.SOLUCIONADO:
                this.elemento.className = "solucionado";
                break;

            case Bloco.EXPLOSAO:
                this.elemento.className = "explosao";
                break;

            case Bloco.QUEIMADO:
                this.elemento.className = this.temMina ? "explosao-foco" : "queimado";
                break;
            
            // Fechado
            default:
                this.elemento.className = this.temBandeira ? "bandeira" : "fechado";
                this.atualizaMinasEmVolta();
                break
        }
    }

    atualizaMinasEmVolta( minasEmVolta = this.minasEmVolta )
    {
        this.minasEmVolta = minasEmVolta;
        this.elemento.style.color = this.temBandeira ? Bloco.CORES[0] : Bloco.CORES[ minasEmVolta ];
        this.elemento.textContent = this.temBandeira ? "X" : ( minasEmVolta > 0 ? minasEmVolta : "");
    }

    bandeira()
    {
        this.temBandeira = !this.temBandeira;
        this.atualizaEstado();
        this.atualizaMinasEmVolta();
    }

    criaElemento()
    {
        let elemento = document.createElement("td");
        elemento.id = `bloco-${this.x}-${this.y}`;
        return elemento;
    }
}

class Menu
{
    // Estado de jogo
    static jogo;
    // Visibilidade do menu
    static mostrar = true;

    // Limites de bombas
    static minBombas = 10;
    static maxBombas = 80;

    // Limites de tamanho
    static MIN_LARGURA = 9;
    static MAX_LARGURA = 30;
    static MIN_ALTURA = 9;
    static MAX_ALTURA = 30;

    // Dificuldades de jogo
    static dificuldades =
    {
        INICIANTE: 0,
        INTERMEDIARIO: 1,
        EXPERIENTE: 2,
        CUSTOMIZADO: 3
    };

    // Tamanho e bombas predefinidas
    static predefinicoes =
    [
        // Iniciante
        {   
            bombas: 10,
            largura: 9,
            altura: 9
        },
        // Intermediário
        {   
            bombas: 40,
            largura: 16,
            altura: 16
        },
        // Experiente
        {   
            bombas: 99,
            largura: 30,
            altura: 16
        }
    ];

    // Armazenam os valores selecionados
    static dificuldade;
    static bombas;
    static largura;
    static altura;

    // Elementos HTML
    static elementos =
    {
        // Configurações
        menu: document.getElementById("menu"),
        // Radio inputs
        dificuldades:
        {
            iniciante: document.getElementById("iniciante"),
            intermediario: document.getElementById("intermediario"),
            experiente: document.getElementById("experiente"),
            customizado: document.getElementById("customizado"),
        },
        bombas:
        {
            // Textos
            maximo: document.getElementById("bombasMaximo"),
            // Range input
            intervalo: document.getElementById("bombasIntervalo"),
            // Text input
            texto: document.getElementById("bombasTexto")
        },
        largura:
        {
            // Range input
            intervalo: document.getElementById("larguraIntervalo"),
            // Text input
            texto: document.getElementById("larguraTexto")
        },
        altura:
        {
            // Range input
            intervalo: document.getElementById("alturaIntervalo"),
            // Text input
            texto: document.getElementById("alturaTexto")
        },
        // Começa o jogo
        iniciar: document.getElementById("iniciar"),
        // Alterna visibilidade do menu
        alternaMenu: document.getElementById("alternaMenu")
    };

    // Métodos

    static alteraDificuldade( dificuldade )
    {
        // Configura a dificuldade
        Menu.dificuldade = dificuldade;

        // Objeto com elementos relacionados às bombas
        let mnDificuldades = Menu.elementos.dificuldades;

        // Seleciona visualmente
        switch ( dificuldade )
        {
            case Menu.dificuldades.INICIANTE:
                mnDificuldades.iniciante.checked = true;
                break;
            case Menu.dificuldades.INTERMEDIARIO:
                mnDificuldades.intermediario.checked = true;
                break;
            case Menu.dificuldades.EXPERIENTE:
                mnDificuldades.experiente.checked = true;
                break;
            // Customizado
            default:
                mnDificuldades.customizado.checked = true;
                break;
        }
        
        // Busca as predefinições
        let { largura, altura, bombas } = dificuldade != Menu.dificuldades.CUSTOMIZADO ? Menu.predefinicoes[ dificuldade ] : { largura: Menu.largura, altura: Menu.altura, bombas: Menu.bombas };

        // Configura controles de tamanho
        Menu.mudaLargura( largura );
        Menu.mudaAltura( altura );

        // Configura controles 
        Menu.mudaMaxBombas( Menu.largura * Menu.altura - 1 );
        Menu.mudaBombas( bombas );

        Menu.alternaMenu( dificuldade != Menu.dificuldades.CUSTOMIZADO );
    }

    static alternaMenu( ativa )
    {
        Menu.elementos.bombas.intervalo.disabled = ativa;
        Menu.elementos.bombas.texto.disabled = ativa;
        Menu.elementos.largura.intervalo.disabled = ativa;
        Menu.elementos.largura.texto.disabled = ativa;
        Menu.elementos.altura.intervalo.disabled = ativa;
        Menu.elementos.altura.texto.disabled = ativa;
    }

    static alternaVisibilidade()
    {
        Menu.mostrar = !Menu.mostrar;
        Menu.elementos.menu.style.display = Menu.mostrar ? "block" : "none";
        Menu.elementos.alternaMenu.textContent = `${Menu.mostrar ? "Esconder" : "Exibir"} menu`;
    }

    static configura()
    {
        Menu.configuraDificuldade();
        Menu.configuraBombas();
        Menu.configuraTamanho();
        Menu.configuraBotoes();
    }

    static configuraBombas()
    {
        // Objeto com elementos relacionados às bombas
        let mnBombas = Menu.elementos.bombas;

        // Configura o intervalo de bombas
        mnBombas.intervalo.min = Menu.minBombas;
        Menu.mudaMaxBombas( Menu.largura * Menu.altura - 1 );
        Menu.mudaBombas( Menu.minBombas );

        // Atualização do intervalo
        mnBombas.intervalo.addEventListener("input", () =>
        {
            // Muda o valor do texto e salva a quantidade de bombas
            Menu.mudaBombas( mnBombas.intervalo.value );
        });

        // Atualização do texto
        mnBombas.texto.addEventListener("change", () =>
        {
            let n = parseInt( mnBombas.texto.value );
            
            // Validação de input
            if ( n && n >= Menu.minBombas && n <= Menu.maxBombas )
                Menu.mudaBombas( mnBombas.texto.value );
            else
                // Valor antigo
                mnBombas.texto.value = Menu.bombas;
        });
    }

    static configuraBotoes()
    {
        Menu.alternaVisibilidade();
        
        Menu.elementos.iniciar.addEventListener("click", () =>
        {
            Menu.novoJogo( Menu.dificuldade );
        });
        Menu.elementos.alternaMenu.addEventListener("click", () =>
        {
            Menu.alternaVisibilidade();
        });
    }
    
    static configuraDificuldade()
    {
        // Objeto com elementos relacionados às bombas
        let mnDificuldades = Menu.elementos.dificuldades;

        // Dificuldade padrão
        Menu.alteraDificuldade( Menu.dificuldades.INICIANTE );

        mnDificuldades.iniciante.addEventListener("click", () =>
        {
            Menu.alteraDificuldade( Menu.dificuldades.INICIANTE );
        });
        mnDificuldades.intermediario.addEventListener("click", () =>
        {
            Menu.alteraDificuldade( Menu.dificuldades.INTERMEDIARIO );
        });
        mnDificuldades.experiente.addEventListener("click", () =>
        {
            Menu.alteraDificuldade( Menu.dificuldades.EXPERIENTE );
        });
        mnDificuldades.customizado.addEventListener("click", () =>
        {
            Menu.alteraDificuldade( Menu.dificuldades.CUSTOMIZADO );
        });
    }

    static configuraTamanho()
    {
        // Objeto com elementos relacionados ao tamanho do campo
        let mnAltura = Menu.elementos.altura;
        let mnLargura = Menu.elementos.largura;

        // Configura os intervalos
        Menu.mudaAltura( Menu.altura );
        Menu.mudaLargura( Menu.largura );

        // Atualização do intervalo de altura
        mnAltura.intervalo.addEventListener("input", () =>
        {
            // Muda o valor do texto e salva a altura
            Menu.mudaAltura( mnAltura.intervalo.value );
        });

        // Atualização do texto de altura
        mnAltura.texto.addEventListener("change", () =>
        {
            let n = parseInt( mnAltura.texto.value );
            
            // Validação de input
            if ( n && n >= Menu.MIN_ALTURA && n <= Menu.MAX_ALTURA )
                Menu.mudaAltura( mnAltura.texto.value );
            else
                // Valor antigo
                mnAltura.texto.value = Menu.altura;
        });

        // Atualização do intervalo de largura
        mnLargura.intervalo.addEventListener("input", () =>
        {
            // Muda o valor do texto e salva a largura
            Menu.mudaLargura( mnLargura.intervalo.value );
        });

        // Atualização do texto de largura
        mnLargura.texto.addEventListener("change", () =>
        {
            let n = parseInt( mnLargura.texto.value );
            
            // Validação de input
            if ( n && n >= Menu.MIN_LARGURA && n <= Menu.MAX_LARGURA )
                Menu.mudaLargura( mnLargura.texto.value );
            else
                // Valor antigo
                mnLargura.texto.value = Menu.largura;
        });
    }

    static mudaAltura( altura )
    {
        // Muda a altura
        Menu.altura = altura;

        // Troca os valores do intervalo e do texto
        Menu.elementos.altura.intervalo.value = altura;
        Menu.elementos.altura.texto.value = altura;

        // Altera a quantidade máxima de bombas
        Menu.mudaMaxBombas( Menu.altura * Menu.largura - 1 );
    }


    static mudaBombas( bombas )
    {
        // Muda a quantidade de bombas
        Menu.bombas = bombas;
        
        // Troca os valores do intervalo e do texto
        Menu.elementos.bombas.intervalo.value = bombas;
        Menu.elementos.bombas.texto.value = bombas;
    }

    static mudaLargura( largura )
    {
        // Muda a largura
        Menu.largura = largura;

        // Troca os valores do intervalo e do texto
        Menu.elementos.largura.intervalo.value = largura;
        Menu.elementos.largura.texto.value = largura;

        // Altera a quantidade máxima de bombas
        Menu.mudaMaxBombas( Menu.altura * Menu.largura - 1 );
    }

    static mudaMaxBombas( maxBombas )
    {
        // Muda a quantidade máxima de bombas
        Menu.maxBombas = maxBombas;

        // Altera o valor máximo do intervalo e o texto ao lado
        Menu.elementos.bombas.intervalo.max = maxBombas;
        Menu.elementos.bombas.maximo.textContent = maxBombas;
        
        // Prende a quantidade de bombas dentro do limite
        if ( Menu.bombas > maxBombas )
            Menu.mudaBombas( maxBombas );
    }

    static novoJogo( dificuldade )
    {
        // Testa se a dificuldade é válida
        let dificuldadeValida = ( dificuldade >= 0 && dificuldade < Menu.predefinicoes.length );
        
        // Se for válida, carrega configurações, caso contrário carrega valores customizados
        let { largura, altura, bombas } = dificuldadeValida ? Menu.predefinicoes[ dificuldade ] : { largura: Menu.largura, altura: Menu.altura, bombas: Menu.bombas };

        Menu.jogo = new Jogo( largura, altura, bombas );
    }
}

Menu.configura();