// 独立站电商商品详情页信息提取器
class IndependentEcommerceExtractor {
  constructor() {
    this.productData = {};
    this.commonSelectors = this.getCommonSelectors();
    this.schemaData = this.extractSchemaData();
  }

  // 通用选择器配置（适用于独立站电商）
  getCommonSelectors() {
    return {
      // 商品标题选择器（按优先级排序）
      title: [
        // Schema.org 结构化数据
        '[itemprop="name"]',
        '[property="product:title"]',
        '[property="og:title"]',
        // 常见的语义化标签
        'h1.product-title',
        'h1.product-name', 
        'h1[class*="product"]',
        'h1[class*="title"]',
        '.product-title h1',
        '.product-name h1',
        '.product-info h1',
        '.product-details h1',
        // 通用H1标签
        'h1',
        // Shopify常见结构
        '.product-single__title',
        '.product__title',
        // WooCommerce常见结构
        '.product_title',
        '.entry-title',
        // 其他常见类名
        '.product-title',
        '.product-name',
        '.item-title',
        '.goods-title',
        '.title'
      ],

      // 价格选择器
      price: [
        // Schema.org 价格
        '[itemprop="price"]',
        '[itemprop="lowPrice"]',
        '[property="product:price:amount"]',
        // 常见价格类名
        '.price-current',
        '.current-price',
        '.sale-price',
        '.price-now',
        '.product-price .price',
        '.product-price-value',
        '.price-box .price',
        '.price .amount',
        // Shopify价格
        '.product-form__cart-submit .price',
        '.price__current',
        '.product__price',
        // WooCommerce价格
        '.woocommerce-Price-amount',
        '.price .woocommerce-Price-amount',
        // 通用价格选择器
        '.price',
        '.cost',
        '.amount',
        '[class*="price"]',
        '[id*="price"]'
      ],

      // 原价/划线价
      originalPrice: [
        '[itemprop="highPrice"]',
        '.price-original',
        '.original-price',
        '.regular-price',
        '.price-old',
        '.price-was',
        '.compare-price',
        '.price__compare',
        '.price-compare',
        '.was-price',
        '.list-price',
        '.msrp-price',
        '.retail-price',
        '.price del',
        '.price .del',
        'del.price',
        '.price s',
        's.price'
      ],

      // 商品图片
      images: [
        // 主图
        '.product-image img',
        '.product-photo img',
        '.product-gallery img',
        '.product-slider img',
        '.product-carousel img',
        '.main-image img',
        '.hero-image img',
        '.featured-image img',
        // Shopify图片
        '.product__media img',
        '.product-single__photos img',
        // WooCommerce图片
        '.woocommerce-product-gallery img',
        '.product-images img',
        // 通用图片选择器
        '[class*="product"] img',
        '[class*="gallery"] img',
        '[data-src]',
        'img[alt*="product"]',
        'img[alt*="商品"]'
      ],

      // 商品描述
      description: [
        // Schema.org描述
        '[itemprop="description"]',
        '[property="og:description"]',
        '[name="description"]',
        // 常见描述区域
        '.product-description',
        '.product-details',
        '.product-summary',
        '.product-content',
        '.product-info',
        '.product-overview',
        '.description',
        '.summary',
        '.content',
        '.details',
        // Shopify描述
        '.product-single__description',
        '.product__description',
        // WooCommerce描述
        '.woocommerce-product-details__short-description',
        '.product-short-description',
        // 通用描述
        '[class*="description"]',
        '[class*="summary"]',
        '[class*="overview"]'
      ],

      // 规格参数
      specifications: [
        '.product-specs',
        '.product-attributes',
        '.product-features',
        '.product-details',
        '.specifications',
        '.attributes',
        '.features',
        '.product-info table',
        '.product-data table',
        '.spec-table',
        '.attribute-table',
        '.product-properties',
        '.product-parameters',
        // WooCommerce属性
        '.woocommerce-product-attributes',
        '.product-attributes-wrapper',
        // 通用表格和列表
        'table[class*="spec"]',
        'table[class*="attribute"]',
        'ul[class*="spec"]',
        'ul[class*="attribute"]',
        'dl[class*="spec"]',
        'dl[class*="attribute"]'
      ],

      // 品牌信息
      brand: [
        '[itemprop="brand"]',
        '[property="product:brand"]',
        '.product-brand',
        '.brand',
        '.manufacturer',
        '.vendor',
        '.supplier',
        '[class*="brand"]'
      ],

      // 库存状态
      stock: [
        '[itemprop="availability"]',
        '.stock-status',
        '.availability',
        '.inventory',
        '.product-stock',
        '.in-stock',
        '.out-of-stock',
        '[class*="stock"]',
        '[class*="availability"]'
      ],

      // SKU
      sku: [
        '[itemprop="sku"]',
        '[itemprop="productID"]',
        '.product-sku',
        '.sku',
        '.product-id',
        '.item-number',
        '.model-number',
        '[class*="sku"]'
      ]
    };
  }

  // 提取Schema.org结构化数据
  extractSchemaData() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    let schemaData = {};

    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Product' || (Array.isArray(data) && data.some(item => item['@type'] === 'Product'))) {
          const productData = Array.isArray(data) ? data.find(item => item['@type'] === 'Product') : data;
          schemaData = productData;
        }
      } catch (e) {
        console.warn('解析Schema.org数据失败:', e);
      }
    });

    return schemaData;
  }

  // 智能文本提取（支持多个选择器）
  extractText(selectors, options = {}) {
    const { 
      cleanPrice = false, 
      maxLength = 1000,
      getAttribute = null,
      multiple = false 
    } = options;

    let results = [];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (!element) continue;

        let text = '';
        if (getAttribute) {
          text = element.getAttribute(getAttribute) || '';
        } else {
          text = element.textContent || element.innerText || '';
        }

        text = text.trim();
        if (!text) continue;

        // 价格清理
        if (cleanPrice) {
          text = this.cleanPrice(text);
        }

        // 长度限制
        if (text.length > maxLength) {
          text = text.substring(0, maxLength) + '...';
        }

        if (multiple) {
          results.push(text);
        } else if (text) {
          return text;
        }
      }
    }

    return multiple ? results : '';
  }

  // 价格清理函数
  cleanPrice(priceText) {
    if (!priceText) return '';
    
    // 移除货币符号和非数字字符，保留小数点
    let cleaned = priceText.replace(/[^\d.,]/g, '');
    
    // 处理千分位分隔符
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // 如果同时包含逗号和点，假设逗号是千分位分隔符
      cleaned = cleaned.replace(/,/g, '');
    } else if (cleaned.includes(',')) {
      // 如果只有逗号，可能是小数分隔符（欧洲格式）
      const commaIndex = cleaned.lastIndexOf(',');
      const afterComma = cleaned.substring(commaIndex + 1);
      if (afterComma.length <= 2) {
        // 如果逗号后面只有1-2位数字，可能是小数分隔符
        cleaned = cleaned.replace(',', '.');
      } else {
        // 否则是千分位分隔符
        cleaned = cleaned.replace(/,/g, '');
      }
    }

    return cleaned;
  }

  // 提取图片URLs
  extractImages() {
    const imageUrls = new Set();
    const selectors = this.commonSelectors.images;

    for (const selector of selectors) {
      const images = document.querySelectorAll(selector);
      
      images.forEach(img => {
        // 获取图片URL的多种方式
        const urls = [
          img.src,
          img.dataset.src,
          img.dataset.lazySrc,
          img.dataset.original,
          img.getAttribute('data-zoom-image'),
          img.getAttribute('data-large-image')
        ].filter(url => url && url.startsWith('http'));

        urls.forEach(url => {
          // 过滤掉过小的图片（可能是图标）
          if (!url.includes('icon') && !url.includes('logo') && !url.includes('badge')) {
            imageUrls.add(url);
          }
        });
      });
    }

    return Array.from(imageUrls).slice(0, 10); // 限制最多10张图片
  }

  // 提取规格参数
  extractSpecifications() {
    const specs = [];
    const selectors = this.commonSelectors.specifications;

    for (const selector of selectors) {
      const containers = document.querySelectorAll(selector);
      
      containers.forEach(container => {
        // 处理表格格式
        if (container.tagName === 'TABLE') {
          const rows = container.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const key = cells[0].textContent.trim();
              const value = cells[1].textContent.trim();
              if (key && value) {
                specs.push(`${key}: ${value}`);
              }
            }
          });
        }
        // 处理定义列表格式
        else if (container.tagName === 'DL') {
          const terms = container.querySelectorAll('dt');
          const descriptions = container.querySelectorAll('dd');
          for (let i = 0; i < Math.min(terms.length, descriptions.length); i++) {
            const key = terms[i].textContent.trim();
            const value = descriptions[i].textContent.trim();
            if (key && value) {
              specs.push(`${key}: ${value}`);
            }
          }
        }
        // 处理列表格式
        else if (container.tagName === 'UL' || container.tagName === 'OL') {
          const items = container.querySelectorAll('li');
          items.forEach(item => {
            const text = item.textContent.trim();
            if (text && text.length < 200) {
              specs.push(text);
            }
          });
        }
        // 处理其他格式
        else {
          const text = container.textContent.trim();
          if (text && text.length < 500) {
            // 尝试按行分割
            const lines = text.split('\n').filter(line => line.trim());
            lines.forEach(line => {
              if (line.length < 100) {
                specs.push(line.trim());
              }
            });
          }
        }
      });
    }

    return specs.slice(0, 20); // 限制最多20个规格
  }

  // 从Schema.org数据中提取信息
  extractFromSchema() {
    if (!this.schemaData || Object.keys(this.schemaData).length === 0) {
      return {};
    }

    const schema = this.schemaData;
    const data = {};

    // 提取基本信息
    if (schema.name) data.title = schema.name;
    if (schema.description) data.description = schema.description;
    if (schema.brand) {
      data.brand = typeof schema.brand === 'string' ? schema.brand : schema.brand.name;
    }
    if (schema.sku) data.sku = schema.sku;
    if (schema.gtin || schema.gtin13 || schema.gtin12 || schema.gtin8) {
      data.gtin = schema.gtin || schema.gtin13 || schema.gtin12 || schema.gtin8;
    }

    // 提取价格信息
    if (schema.offers) {
      const offers = Array.isArray(schema.offers) ? schema.offers[0] : schema.offers;
      if (offers.price) data.price = offers.price;
      if (offers.priceCurrency) data.currency = offers.priceCurrency;
      if (offers.availability) data.availability = offers.availability;
    }

    // 提取图片
    if (schema.image) {
      const images = Array.isArray(schema.image) ? schema.image : [schema.image];
      data.images = images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
    }

    return data;
  }

  // 主提取函数
  extractProductData() {
    const schemaData = this.extractFromSchema();
    
    this.productData = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      domain: window.location.hostname,
      
      // 优先使用Schema.org数据，然后使用选择器提取
      title: schemaData.title || this.extractText(this.commonSelectors.title),
      description: schemaData.description || this.extractText(this.commonSelectors.description, { maxLength: 2000 }),
      price: schemaData.price || this.extractText(this.commonSelectors.price, { cleanPrice: true }),
      originalPrice: this.extractText(this.commonSelectors.originalPrice, { cleanPrice: true }),
      brand: schemaData.brand || this.extractText(this.commonSelectors.brand),
      sku: schemaData.sku || this.extractText(this.commonSelectors.sku),
      currency: schemaData.currency || this.detectCurrency(),
      availability: schemaData.availability || this.extractText(this.commonSelectors.stock),
      
      // 图片和规格
      images: schemaData.images || this.extractImages(),
      specifications: this.extractSpecifications(),
      
      // 页面元数据
      pageTitle: document.title,
      metaDescription: this.getMetaDescription(),
      
      // 提取统计
      extractionMethod: Object.keys(schemaData).length > 0 ? 'schema+selectors' : 'selectors',
      extractedAt: new Date().toLocaleString('zh-CN')
    };

    return this.productData;
  }

  // 检测货币
  detectCurrency() {
    const text = document.body.textContent;
    if (text.includes('¥') || text.includes('￥') || text.includes('RMB')) return 'CNY';
    if (text.includes('$') || text.includes('USD')) return 'USD';
    if (text.includes('€') || text.includes('EUR')) return 'EUR';
    if (text.includes('£') || text.includes('GBP')) return 'GBP';
    return 'USD'; // 默认
  }

  // 获取meta描述
  getMetaDescription() {
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc ? metaDesc.getAttribute('content') : '';
  }

  // 生成AI友好的Markdown
  generateMarkdown() {
    const data = this.productData;
    
    let markdown = `# ${data.title || '商品详情'}\n\n`;
    
    // 元数据区块（对AI模型很重要）
    markdown += `## 📊 商品元数据\n\n`;
    markdown += `| 字段 | 值 |\n`;
    markdown += `|------|----|\n`;
    markdown += `| 商品URL | ${data.url} |\n`;
    markdown += `| 网站域名 | ${data.domain} |\n`;
    markdown += `| 提取时间 | ${data.extractedAt} |\n`;
    markdown += `| 提取方法 | ${data.extractionMethod} |\n`;
    if (data.sku) markdown += `| SKU | ${data.sku} |\n`;
    if (data.brand) markdown += `| 品牌 | ${data.brand} |\n`;
    markdown += `\n`;
    
    // 价格信息区块
    if (data.price || data.originalPrice) {
      markdown += `## 💰 价格信息\n\n`;
      if (data.price) {
        markdown += `**当前价格**: ${data.currency || ''} ${data.price}\n\n`;
      }
      if (data.originalPrice && data.originalPrice !== data.price) {
        markdown += `**原价**: ${data.currency || ''} ${data.originalPrice}\n\n`;
      }
      if (data.availability) {
        markdown += `**库存状态**: ${data.availability}\n\n`;
      }
    }
    
    // 商品描述区块
    if (data.description) {
      markdown += `## 📝 商品描述\n\n`;
      markdown += `${data.description}\n\n`;
    }
    
    // 规格参数区块
    if (data.specifications && data.specifications.length > 0) {
      markdown += `## 🔧 技术规格\n\n`;
      data.specifications.forEach(spec => {
        markdown += `- ${spec}\n`;
      });
      markdown += `\n`;
    }
    
    // 图片区块
    if (data.images && data.images.length > 0) {
      markdown += `## 🖼️ 商品图片\n\n`;
      data.images.forEach((imageUrl, index) => {
        markdown += `### 图片 ${index + 1}\n`;
        markdown += `![商品图片${index + 1}](${imageUrl})\n\n`;
        markdown += `**图片URL**: ${imageUrl}\n\n`;
      });
    }
    
    // 页面信息区块
    markdown += `## 📄 页面信息\n\n`;
    markdown += `**页面标题**: ${data.pageTitle}\n\n`;
    if (data.metaDescription) {
      markdown += `**页面描述**: ${data.metaDescription}\n\n`;
    }
    
    // 结构化数据标记（便于AI解析）
    markdown += `---\n\n`;
    markdown += `<!-- AI_METADATA_START\n`;
    markdown += `${JSON.stringify(data, null, 2)}\n`;
    markdown += `AI_METADATA_END -->\n\n`;
    
    markdown += `*此文档由独立站电商商品详情提取器自动生成，优化用于AI模型识别和处理*\n`;
    
    return markdown;
  }
}

// 全局变量
let extractor = null;
let isContentScriptReady = false;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理ping请求，用于检查content script是否准备好
  if (request.action === 'ping') {
    sendResponse({ ready: isContentScriptReady });
    return true;
  }
  
  if (request.action === 'extractProduct') {
    try {
      // 确保已初始化
      if (!isContentScriptReady) {
        initializeExtractor();
      }
      
      // 创建新的提取器实例
      extractor = new IndependentEcommerceExtractor();
      const productData = extractor.extractProductData();
      const markdown = extractor.generateMarkdown();
      
      // 添加视觉反馈
      showNotification('商品信息提取成功！', 'success');
      
      sendResponse({
        success: true,
        data: productData,
        markdown: markdown
      });
    } catch (error) {
      console.error('提取失败:', error);
      showNotification(`提取失败: ${error.message}`, 'error');
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  
  return true; // 保持消息通道开放
});

// 显示通知函数
function showNotification(message, type = 'info') {
  // 移除现有通知
  const existingNotification = document.querySelector('.product-extractor-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 创建新通知
  const notification = document.createElement('div');
  notification.className = `product-extractor-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// 初始化函数
function initializeExtractor() {
  if (!isContentScriptReady) {
    console.log('独立站电商详情页提取器正在初始化...');
    console.log('页面URL:', window.location.href);
    console.log('页面状态:', document.readyState);
    isContentScriptReady = true;
    console.log('独立站电商详情页提取器已就绪');
    
    // 通知后台脚本内容脚本已就绪
    chrome.runtime.sendMessage({ action: 'contentScriptReady' }).catch(() => {
      // 忽略错误，因为popup可能还没打开
    });
  }
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtractor);
} else {
  // 如果页面已经加载完成，立即初始化
  initializeExtractor();
}

// 确保在页面完全加载后也进行初始化
if (document.readyState !== 'complete') {
  window.addEventListener('load', initializeExtractor);
}