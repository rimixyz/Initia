# Initia ✨

![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) 
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) 
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E) 
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

**Initia** é uma Startpage pensada para ser limpa, rápida e 100% focada em privacidade. Ela foi desenhada para ser o seu ponto de partida diário no navegador, reunindo as ferramentas essenciais para produtividade sem enviar nenhum dado seu para servidores externos.

Tudo o que você configura e anota no Initia fica guardado exclusivamente no armazenamento local (`localStorage`) do seu próprio navegador.

## 🌟 O que tem de bom?
*   **Privacidade Total:** Sem banco de dados, sem rastreamento de uso.
*   **Customização Estética:** Tema claro/escuro, tema automático por horário e opções de imagens de fundo dinâmicas.
*   **Clima ao Vivo:** Integração meteorológica da sua cidade com efeitos visuais diretamente no fundo da tela (chuva, neve, neblina).
*   **Modo Zen:** Esconde todos os elementos para foco total.
*   **Produtividade Integrada:**
    *   **Inai (IA):** Assistente de inteligência artificial integrado (via Gemini API) para tirar dúvidas, resumir textos ou gerar ideias direto na sua página inicial.
    *   Timer Pomodoro com Alarmes (via Web Audio API)
    *   Cronômetro de Voltas
    *   Tarefas Diárias (To-Do)
    *   Notas Rápidas
    *   Conversor de Unidades e Moedas
*   **Calculadora Integrada:** Contas numéricas diretas na barra de pesquisa sem precisar abrir abas extras.
*   **Segurança de API:** O Inai exige a sua própria chave API do Google Gemini, que fica guardada localmente. Ninguém além de você tem acesso ao seu uso.
*   **Backup:** Importe e exporte todas as suas configurações num arquivo JSON.

## ⚙️ Como Instalar (Extensão do Chrome)
Como o Initia foi feito para ser a sua página de Nova Guia (New Tab) nativa, a instalação é muito simples e feita de forma local:

1. Baixe os arquivos do projeto ou faça um `git clone` deste repositório.
2. Abra o Google Chrome e acesse: `chrome://extensions/`
3. Ative o **"Modo do desenvolvedor"** no canto superior direito.
4. Clique no botão **"Carregar sem compactação"** (Load unpacked) no canto superior esquerdo.
5. Selecione a pasta onde o Initia foi salvo.
6. Pronto! Ao abrir uma Nova Guia, o Initia já estará rodando em frações de segundos.

## 💭 Por que o Initia existe?
Este projeto nasceu de uma **necessidade puramente pessoal**. Eu simplesmente não gostava das Startpages genéricas ou lotadas de distrações e anúncios que existem pela internet. Eu queria algo **100% meu**, ultra-rápido, personalizável, e que **não enviasse meus dados ou o que eu anoto para banco de dados de terceiros**.

Foi criado inicialmente como minha ferramenta de produtividade silenciosa para o dia a dia. Porém, vendo o quão robusto e completo ele ficou, percebi um imenso potencial para ele ser **Open Source**. 

O Initia é um projeto 100% brasileiro 🇧🇷, focado no uso local via navegador. Minha intenção ao abri-lo aqui é incentivar outros desenvolvedores a estudarem esse código. Fiquem à vontade para fazer *forks*, criar novos widgets ou melhorar as animações. Se o projeto ganhar visibilidade, certamente pensarei em expandi-lo para suportar outros idiomas! 

## 🤝 Atribuições (Obrigado!)
O Initia consome dados públicos e gratuitos para entregar uma experiência completa. Este projeto não seria possível sem as seguintes APIs e serviços geniais:

*   **[Open-Meteo](https://open-meteo.com/):** Fornece os dados meteorológicos precisos de graça, sem precisar de chaves de API.
*   **[BrasilAPI](https://brasilapi.com.br/):** Retorna os Feriados Nacionais na construção inteligente do Calendário.
*   **[AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas):** Usada para a cotação de moedas em tempo real no Conversor.
*   **[Lorem Picsum](https://picsum.photos/):** Gera e hospeda as texturas aleatórias minimalistas usadas como plano de fundo padrão.
*   Agradecimentos também às APIs das plataformas configuráveis no background (**Unsplash**, **Pexels**, **Pixabay**) e ao **Google Favicons** (usado para resgatar os ícones dos seus Links Rápidos).
*   Ícones maravilhosos oferecidos pelo **[FontAwesome](https://fontawesome.com/)**.

---
Feito com 🤍 por **rimi**
Distribuído sob a licença **MIT** (Veja o arquivo `LICENSE` para mais detalhes).
