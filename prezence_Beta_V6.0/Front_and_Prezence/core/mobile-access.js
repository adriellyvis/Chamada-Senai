(function () {
    "use strict";

    const trigger = document.getElementById("mobileAccessTrigger");
    const modal = document.getElementById("mobileAccessModal");
    const input = document.getElementById("mobileAccessUrl");
    const updateButton = document.getElementById("mobileQrUpdate");
    const copyButton = document.getElementById("mobileCopyLink");
    const canvas = document.getElementById("mobileQrCanvas");
    const placeholder = document.getElementById("mobileQrPlaceholder");
    const status = document.getElementById("mobileUrlStatus");
    const secureBadge = document.getElementById("mobileSecureBadge");

    if (!trigger || !modal || !input || !canvas || !window.PrezenceQRCode) {
        return;
    }

    const STORAGE_KEY = "prezence.mobile-access-url";
    let ultimoFoco = null;

    function urlAtual() {
        const atual = new URL(window.location.href);
        atual.hash = "";
        atual.search = "";
        return atual.toString();
    }

    function hostLocal(hostname) {
        const host = String(hostname || "").toLowerCase();
        return host === "localhost"
            || host === "::1"
            || host === "[::1]"
            || host === "0.0.0.0"
            || host.startsWith("127.");
    }

    function analisarEndereco(valor) {
        const texto = String(valor || "").trim();

        if (!texto) {
            return { valido: false, mensagem: "Informe o endereço que o celular usará para abrir o Prezence." };
        }

        let url;
        try {
            url = new URL(texto);
        } catch (_) {
            return { valido: false, mensagem: "Informe uma URL completa, por exemplo: https://192.168.0.15:5501/index.html" };
        }

        if (!/^https?:$/.test(url.protocol)) {
            return { valido: false, mensagem: "Use um endereço iniciado por http:// ou https://." };
        }

        if (hostLocal(url.hostname)) {
            return {
                valido: false,
                loopback: true,
                url,
                mensagem: "127.0.0.1/localhost só funciona neste computador. Troque pelo IP do notebook na rede."
            };
        }

        return {
            valido: true,
            url,
            seguro: url.protocol === "https:",
            mensagem: url.protocol === "https:"
                ? "Endereço pronto para acesso mobile e adequado ao uso da câmera."
                : "O link pode abrir no celular, mas o Face Scan pode ser bloqueado sem HTTPS."
        };
    }

    function desenharQr(texto) {
        const { QRCode, ErrorCorrectLevel } = window.PrezenceQRCode;
        const qr = new QRCode(0, ErrorCorrectLevel.M);
        qr.addData(texto);
        qr.make();

        const modulos = qr.getModuleCount();
        const margem = 4;
        const alvo = 232;
        const celula = Math.max(1, Math.floor(alvo / (modulos + margem * 2)));
        const tamanho = celula * (modulos + margem * 2);
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

        canvas.width = tamanho * dpr;
        canvas.height = tamanho * dpr;
        canvas.style.width = tamanho + "px";
        canvas.style.height = tamanho + "px";

        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tamanho, tamanho);
        ctx.fillStyle = "#12152b";

        for (let linha = 0; linha < modulos; linha += 1) {
            for (let coluna = 0; coluna < modulos; coluna += 1) {
                if (qr.isDark(linha, coluna)) {
                    ctx.fillRect(
                        (coluna + margem) * celula,
                        (linha + margem) * celula,
                        celula,
                        celula
                    );
                }
            }
        }
    }

    function atualizarQr({ salvar = true } = {}) {
        const analise = analisarEndereco(input.value);

        status.className = "mobile-url-status";
        secureBadge.classList.remove("is-secure", "is-warning");

        if (!analise.valido) {
            canvas.hidden = true;
            placeholder.hidden = false;
            status.textContent = analise.mensagem;
            status.classList.add("is-error");
            secureBadge.classList.add("is-warning");
            return false;
        }

        try {
            desenharQr(analise.url.toString());
        } catch (erro) {
            canvas.hidden = true;
            placeholder.hidden = false;
            status.textContent = "Não foi possível gerar o QR Code para esse endereço.";
            status.classList.add("is-error");
            return false;
        }

        canvas.hidden = false;
        placeholder.hidden = true;
        status.textContent = analise.mensagem;
        status.classList.add(analise.seguro ? "is-success" : "is-warning");
        secureBadge.classList.add(analise.seguro ? "is-secure" : "is-warning");

        if (salvar) {
            try {
                localStorage.setItem(STORAGE_KEY, analise.url.toString());
            } catch (_) {
                // O QR continua funcionando mesmo quando o armazenamento local está bloqueado.
            }
        }

        return true;
    }

    function enderecoInicial() {
        try {
            const salvo = localStorage.getItem(STORAGE_KEY);
            if (salvo) return salvo;
        } catch (_) {
            // Ignora e usa o endereço atual.
        }
        return urlAtual();
    }

    function abrirModal() {
        ultimoFoco = document.activeElement;
        input.value = enderecoInicial();
        modal.hidden = false;
        document.body.classList.add("mobile-modal-open");
        atualizarQr({ salvar: false });
        requestAnimationFrame(() => input.focus());
    }

    function fecharModal() {
        modal.hidden = true;
        document.body.classList.remove("mobile-modal-open");
        if (ultimoFoco && typeof ultimoFoco.focus === "function") {
            ultimoFoco.focus();
        }
    }

    async function copiarLink() {
        const analise = analisarEndereco(input.value);
        if (!analise.valido) {
            atualizarQr({ salvar: false });
            input.focus();
            return;
        }

        const texto = analise.url.toString();
        let copiado = false;

        try {
            await navigator.clipboard.writeText(texto);
            copiado = true;
        } catch (_) {
            const auxiliar = document.createElement("textarea");
            auxiliar.value = texto;
            auxiliar.setAttribute("readonly", "");
            auxiliar.style.position = "fixed";
            auxiliar.style.opacity = "0";
            document.body.appendChild(auxiliar);
            auxiliar.select();
            copiado = document.execCommand("copy");
            auxiliar.remove();
        }

        if (copiado) {
            const textoOriginal = copyButton.querySelector("span").textContent;
            copyButton.classList.add("is-copied");
            copyButton.querySelector("span").textContent = "Link copiado";
            window.setTimeout(() => {
                copyButton.classList.remove("is-copied");
                copyButton.querySelector("span").textContent = textoOriginal;
            }, 1600);
        }
    }

    trigger.addEventListener("click", abrirModal);
    updateButton.addEventListener("click", () => atualizarQr());
    copyButton.addEventListener("click", copiarLink);

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            atualizarQr();
        }
    });

    modal.addEventListener("click", (event) => {
        if (event.target.closest("[data-mobile-close]")) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            fecharModal();
        }
    });
})();
