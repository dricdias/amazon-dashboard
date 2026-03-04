const html = $input.first().json.data;

// Get the tag from the 'Configurações Necessárias' node
const affiliateTag = $node["Configurações Necessárias"] ? $node["Configurações Necessárias"].json["Tag"] : "linkalhub-20";

let products = [];
// Amazon US sponsored indicators
const regexPatrocinado = /^(?:Anúncio patrocinado|Sponsored)\s?[–-]?\s?/i;

// Function to convert Amazon image URLs to High Res
const toHighRes = (url) => {
    if (!url) return null;
    return url.replace(/\._AC_[^.]+\./, '._AC_SL1500_.');
};

// Function to safely append affiliate tag based on ASIN regex
const appendTag = (pUrl, tag) => {
    if (!pUrl) return pUrl;
    // Extrair ASIN e adicionar tag de afiliado
    const asinMatch = pUrl.match(/\/dp\/([a-zA-Z0-9]{10})/i) || pUrl.match(/\/gp\/product\/([a-zA-Z0-9]{10})/i);
    let asin = asinMatch ? asinMatch[1] : null;
    if (asin) {
        return `https://www.amazon.com/dp/${asin}?tag=${tag}`;
    } else {
        return pUrl.includes('?') ? `${pUrl}&tag=${tag}` : `${pUrl}?tag=${tag}`;
    }
};

// --- ESTRATÉGIA 1: Tenta buscar pelo JSON Oculto (Deals/Widgets) ---
const startMarker = "assets.mountWidget('slot-14',";
const startIndex = html.indexOf(startMarker);

if (startIndex !== -1) {
  let jsonStringCandidate = html.substring(startIndex + startMarker.length).trim();
  let braceCount = 0, endIndex = 0, foundStart = false;

  for (let i = 0; i < jsonStringCandidate.length; i++) {
    if (jsonStringCandidate[i] === '{') { braceCount++; foundStart = true; } 
    else if (jsonStringCandidate[i] === '}') { braceCount--; }
    if (foundStart && braceCount === 0) { endIndex = i + 1; break; }
  }

  if (endIndex > 0) {
    try {
      const jsonData = JSON.parse(jsonStringCandidate.substring(0, endIndex));
      
      // Grab BOTH organic search results and ranked promotions
      let organic = jsonData.prefetchedData?.entity?.searchResults?.products || [];
      let promotions = jsonData.prefetchedData?.entity?.rankedPromotions || [];
      let allItems = [...organic, ...promotions];

      products = allItems.map(item => {
        const productEntity = item.product?.entity || item;
        const buyingOption = productEntity?.buyingOptions?.[0];
        const priceEntity = buyingOption?.price?.entity || productEntity?.price?.entity;
        
        let precoFinal = priceEntity?.priceToPay?.moneyValueOrRange?.value?.amount;
        let tipoPagamento = "Cartão / Padrão";
        
        const activePromotions = productEntity?.promotionsUnified?.entity?.displayablePromotions || [];
        const pixOffer = activePromotions.find(p => p.combinedSavings?.fixedTargetAmount?.amount);
        
        if (pixOffer) {
            precoFinal = pixOffer.combinedSavings.fixedTargetAmount.amount;
            tipoPagamento = "À vista (Pix/Boleto)";
        } else if (item.dealDetails?.entity?.type === "LIGHTNING_DEAL") {
            tipoPagamento = "Oferta Relâmpago";
        }

        const partialLink = productEntity?.links?.entity?.viewOnAmazon?.url || productEntity?.url;
        const imageId = productEntity?.productImages?.entity?.images?.[0]?.hiRes?.physicalId || productEntity?.productImages?.entity?.images?.[0]?.lowRes?.physicalId;
        const imageUrl = imageId ? `https://m.media-amazon.com/images/I/${imageId}.jpg` : (productEntity?.image ? productEntity.image : null);

        let tituloTratado = productEntity?.title?.entity?.displayString || productEntity?.title;
        if (tituloTratado) tituloTratado = tituloTratado.replace(regexPatrocinado, "").trim();
        
        // Construct standard amazon US link
        let link = partialLink ? "https://www.amazon.com" + partialLink : null;

        return {
          titulo: tituloTratado,
          link: appendTag(link, affiliateTag),
          imagem: toHighRes(imageUrl),
          preco_atual: precoFinal,
          preco_antigo: priceEntity?.basisPrice?.moneyValueOrRange?.value?.amount,
          condicao_pagamento: tipoPagamento,
          desconto: priceEntity?.savings?.percentage?.value ? priceEntity.savings.percentage.value + "%" : null,
          parcelamento: buyingOption?.dealDetails?.entity?.type === "INSTALLMENTS" ? "Parcelamento disponível" : null,
          asin: productEntity?.asin || (link ? link.match(/\/dp\/([A-Z0-9]{10})/) && link.match(/\/dp\/([A-Z0-9]{10})/)[1] : null)
        };
      });
    } catch (e) { console.log("Erro Deals JSON: " + e.message); }
  }
}

// --- ESTRATÉGIA 2: HTML Parsing via Regex (Busca Geral ou Fallback) ---
if (products.length === 0) {
  const productBlocks = html.split('data-component-type="s-search-result"');

  for (let i = 1; i < productBlocks.length; i++) {
    const block = productBlocks[i];
    const item = { parcelamento: null, desconto: null };

    const asinMatch = block.match(/data-asin="([^"]+)"/);
    if (asinMatch) item.asin = asinMatch[1];

    const titleImgMatch = block.match(/<img class="s-image"[^>]*alt="([^"]+)"/);
    if (titleImgMatch) item.titulo = titleImgMatch[1];
    else {
        const titleTextMatch = block.match(/class="a-size-(?:medium|base-plus|large)[^"]* a-color-base a-text-normal"[^>]*>([^<]+)</);
        if (titleTextMatch) item.titulo = titleTextMatch[1];
    }
    if (item.titulo) item.titulo = item.titulo.replace(regexPatrocinado, "").trim();

    let linkMatch = block.match(/class="a-link-normal s-no-outline"[^>]*href="([^"]+)"/);
    if (linkMatch) {
        let link = linkMatch[1];
        if (!link.startsWith('http')) link = "https://www.amazon.com" + link;
        item.link = appendTag(link, affiliateTag);
    }

    const imgMatch = block.match(/<img class="s-image"[^>]*src="([^"]+)"/);
    if (imgMatch) item.imagem = toHighRes(imgMatch[1]);

    const priceCurrentMatch = block.match(/<span class="a-price"[^>]*><span class="a-offscreen">([^<]+)</);
    if (priceCurrentMatch) {
        item.preco_atual = priceCurrentMatch[1].replace(/[^\d,.]/g, '').trim(); 
        item.condicao_pagamento = "Preço Amazon";
    }

    const priceOldMatch = block.match(/<span class="a-price a-text-price"[^>]*><span class="a-offscreen">([^<]+)</);
    if (priceOldMatch) item.preco_antigo = priceOldMatch[1].replace(/[^\d,.]/g, '').trim();

    // Try to get discount/coupon
    const couponMatch = block.match(/<span class="s-coupon-highlight-color">([^<]+)</);
    if (couponMatch) item.desconto = couponMatch[1].trim();

    if (item.asin && item.titulo && item.preco_atual) products.push(item);
  }
}

// --- VERIFICAÇÃO FINAL, CORREÇÃO DE PREÇOS E FILTROS ---
// Palavras-chave que indicam produtos digitais, livros ou assinaturas
const regexDigitaisELivros = /ebook|kindle|livro|book|paperback|hardcover|audiolivro|audiobook|audible|assinatura|subscription|prime video/i;

// ISBNs no Brasil geralmente começam com 85 ou 65 e têm 10 caracteres (números, podendo terminar em X).
const regexIsbn = /^(85|65|978)\d{7}[\dX]$/i;

// Conjunto para evitar itens duplicados (mesmo ASIN)
const staticData = $getWorkflowStaticData("global");
staticData.seenAsins = staticData.seenAsins || [];
const seenAsins = new Set(staticData.seenAsins);

products = products.map(item => {
    // Nova função de parsing blindada contra os erros de formatação da Amazon
    const parsePrice = (priceVal) => {
        if (priceVal === null || priceVal === undefined || priceVal === '') return 0;
        if (typeof priceVal === 'number') return priceVal;
        
        let str = String(priceVal).trim();
        // Formato EUA: vírgula é separador de milhar (1,234.56). Remove a vírgula.
        str = str.replace(/,/g, '');
        // Remove qualquer letra, espaço ou símbolo que não seja dígito ou ponto
        str = str.replace(/[^\d.]/g, '');
        return parseFloat(str) || 0;
    };

    let vAtual = parsePrice(item.preco_atual);
    let vAntigo = parsePrice(item.preco_antigo);

    // 1. FILTRO DE PRODUTOS IGNORADOS (Livros, Digitais, Assinaturas e R$ 0,00)
    // Avoid missing items by returning null properly
    if (vAtual === 0 || regexDigitaisELivros.test(item.titulo)) {
        return null; 
    }
    if (item.asin && regexIsbn.test(item.asin)) {
        return null; 
    }
    
    // Filtro de duplicatas
    if (item.asin) {
        if (seenAsins.has(item.asin)) return null;
        seenAsins.add(item.asin);
    }

    // 2. Textos amigáveis caso as informações venham em branco
    if (!item.parcelamento) item.parcelamento = "Consulte opções de parcelamento no site";
    if (!item.desconto) item.desconto = "Oferta imperdível";
    if (!item.condicao_pagamento) item.condicao_pagamento = "Aproveite o preço reduzido";

    // 3. TRAVA DE SEGURANÇA E CORREÇÃO LÓGICA DE PREÇOS
    // Dispara se: não tem preço antigo, atual é mais caro que o antigo, ou se o antigo for absurdamente alto (erro da Amazon)
    if (!vAntigo || vAtual >= vAntigo || vAntigo > (vAtual * 3)) {
        vAntigo = vAtual * 1.15; // Adiciona 15% como fallback natural
    }

    // 4. Padroniza o retorno como Texto formato Moeda EUA garantindo o visual final
    item.preco_atual = vAtual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    item.preco_antigo = vAntigo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return item;
}).filter(item => item !== null);

// Save seenAsins back to staticData (limit to 1000 items to avoid bloated state)
staticData.seenAsins = Array.from(seenAsins);
if (staticData.seenAsins.length > 1000) {
    staticData.seenAsins = staticData.seenAsins.slice(-1000);
}

// Shuffle products to give a good mix of organic results
products.sort(() => Math.random() - 0.5);

return products;
