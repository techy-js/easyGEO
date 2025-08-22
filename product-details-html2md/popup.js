// 独立站商品详情提取器 - Popup控制器
class IndependentStorePopupController {
  constructor() {
    this.currentMarkdown = '';
    this.currentProductData = null;
    this.isExtracting = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.analyzeCurrentPage();
  }

  bindEvents() {
    // 提取按钮
    document.getElementById('extractBtn').addEventListener('click', () => {
      this.extractProductInfo();
    });

    // 下载按钮
    document.getElementById('downloadBtn').addEventListener('click', () => {
      this.downloadMarkdown();
    });

    // 复制按钮
    document.getElementById('copyBtn').addEventListener('click', () => {
      this.copyToClipboard();
    });

    // 预览按钮
    document.getElementById('previewBtn').addEventListener('click', () => {
      this.togglePreview();
    });
  }

  // 分析当前页面
  async analyzeCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.updateStatus('无法在此页面使用插件', 'error', '❌');
        return;
      }

      // 检查并准备内容脚本
      const contentScriptReady = await this.ensureContentScriptInjected(tab.id);
      
      if (!contentScriptReady) {
        this.updateStatus('页面准备中，请稍候再试', '', '⏳');
        return;
      }

      // 检查是否可能是商品页面
      const isLikelyProductPage = await this.checkIfProductPage(tab);
      
      if (isLikelyProductPage.isProduct) {
        this.updateStatus(
          `检测到商品页面\n${isLikelyProductPage.indicators.join(', ')}`, 
          'success', 
          '✅'
        );
      } else {
        this.updateStatus(
          '未检测到明显的商品页面特征\n但仍可尝试提取', 
          '', 
          '⚠️'
        );
      }
    } catch (error) {
      console.error('分析页面失败:', error);
      this.updateStatus('页面分析失败，但可以尝试提取', 'error', '❌');
    }
  }

  // 检查是否是商品页面
  async checkIfProductPage(tab) {
    try {
      // 通过URL关键词判断
      const productUrlKeywords = [
        'product', 'item', 'goods', 'shop', 'store', 'buy',
        'detail', 'p/', '/p', 'products/', '/products',
        '商品', '详情', '购买'
      ];

      const urlLower = tab.url.toLowerCase();
      const urlIndicators = productUrlKeywords.filter(keyword => 
        urlLower.includes(keyword)
      );

      // 通过页面标题判断
      const titleKeywords = [
        'buy', 'shop', 'store', 'product', 'price', '$', '¥', '€', '£',
        '购买', '商店', '商品', '价格', '元', '折扣', '促销'
      ];

      const titleLower = tab.title.toLowerCase();
      const titleIndicators = titleKeywords.filter(keyword => 
        titleLower.includes(keyword)
      );

      const indicators = [];
      if (urlIndicators.length > 0) indicators.push('URL特征');
      if (titleIndicators.length > 0) indicators.push('标题特征');

      return {
        isProduct: indicators.length > 0,
        indicators: indicators,
        confidence: (urlIndicators.length + titleIndicators.length) / (productUrlKeywords.length + titleKeywords.length)
      };
    } catch (error) {
      return { isProduct: false, indicators: [], confidence: 0 };
    }
  }

  // 更新状态显示
  updateStatus(message, type = '', icon = '🔍') {
    const statusCard = document.getElementById('statusCard');
    const statusIcon = statusCard.querySelector('.status-icon');
    const statusText = statusCard.querySelector('.status-text');
    
    statusCard.className = `status-card ${type}`;
    statusIcon.textContent = icon;
    statusText.textContent = message;
  }

  // 显示加载状态
  showLoading(message = '正在智能提取...') {
    if (this.isExtracting) return;
    this.isExtracting = true;

    const extractBtn = document.getElementById('extractBtn');
    const extractIcon = document.getElementById('extractIcon');
    const extractText = document.getElementById('extractText');
    
    extractBtn.disabled = true;
    extractBtn.classList.add('pulse');
    extractIcon.innerHTML = '<div class="spinner"></div>';
    extractText.textContent = message;
    
    this.updateStatus(message, 'loading', '⏳');
  }

  // 隐藏加载状态
  hideLoading() {
    this.isExtracting = false;

    const extractBtn = document.getElementById('extractBtn');
    const extractIcon = document.getElementById('extractIcon');
    const extractText = document.getElementById('extractText');
    
    extractBtn.disabled = false;
    extractBtn.classList.remove('pulse');
    extractIcon.textContent = '🎯';
    extractText.textContent = '智能提取商品信息';
  }

  // 检查内容脚本是否已加载
  async checkContentScriptReady(tabId, maxRetries = 5, retryDelay = 500) {
    console.log(`检查内容脚本是否就绪，标签ID: ${tabId}`);
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`尝试 ${i + 1}/${maxRetries}: 发送ping消息`);
        // 发送ping消息检查content script是否响应
        const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        console.log('收到ping响应:', response);
        
        if (response && response.ready) {
          console.log('内容脚本已就绪');
          return true;
        }
      } catch (error) {
        console.log(`尝试 ${i + 1} 失败:`, error.message);
        // 如果失败，等待一段时间后重试
        if (i < maxRetries - 1) {
          console.log(`等待 ${retryDelay}ms 后重试`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
    }
    console.log('内容脚本检查失败');
    return false;
  }

  // 注入内容脚本（如果需要）
  async ensureContentScriptInjected(tabId) {
    try {
      console.log('开始确保内容脚本已注入...');
      
      // 先尝试检查content script是否已存在
      const isReady = await this.checkContentScriptReady(tabId, 1, 100);
      if (isReady) {
        console.log('内容脚本已存在且准备就绪');
        return true;
      }

      console.log('内容脚本不存在，开始手动注入...');
      
      // 如果不存在，手动注入
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content-script.js']
      });
      console.log('JavaScript文件注入完成');

      // 注入CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content-style.css']
      });
      console.log('CSS文件注入完成');

      // 等待一下让脚本初始化
      console.log('等待脚本初始化...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 再次检查是否准备好
      const finalCheck = await this.checkContentScriptReady(tabId, 5, 300);
      console.log('最终检查结果:', finalCheck);
      return finalCheck;
      
    } catch (error) {
      console.error('注入内容脚本失败:', error);
      
      // 检查是否是权限问题
      if (error.message.includes('Cannot access') || error.message.includes('blocked')) {
        throw new Error('无法访问此页面，请检查页面URL是否正确');
      }
      
      return false;
    }
  }

  // 提取商品信息
  async extractProductInfo() {
    if (this.isExtracting) return;

    this.showLoading('正在准备页面...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查页面URL是否有效
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('无法在此页面使用插件，请在普通网页中使用');
      }

      this.updateStatus('正在检查页面状态...', 'loading', '🔍');
      
      // 确保内容脚本已加载并准备好
      const contentScriptReady = await this.ensureContentScriptInjected(tab.id);
      
      if (!contentScriptReady) {
        throw new Error('页面脚本加载失败，请刷新页面后重试');
      }

      this.updateStatus('正在提取商品信息...', 'loading', '⚡');
      
      // 向内容脚本发送消息
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'extractProduct' 
      });

      this.hideLoading();

      if (response && response.success) {
        this.currentProductData = response.data;
        this.currentMarkdown = response.markdown;
        
        this.displayProductInfo(response.data);
        this.updateStatus('商品信息提取成功！', 'success', '🎉');
        
        // 显示操作按钮
        document.getElementById('downloadBtn').classList.remove('hidden');
        document.getElementById('copyBtn').classList.remove('hidden');
        document.getElementById('previewBtn').classList.remove('hidden');
        
        // 显示提取统计
        this.showExtractionStats(response.data);
      } else {
        throw new Error(response?.error || '提取失败，未获取到有效数据');
      }
    } catch (error) {
      console.error(error)
      this.hideLoading();
      console.error('提取商品信息失败:', error);
      
      if (error.message.includes('Could not establish connection') || 
          error.message.includes('Receiving end does not exist')) {
        this.updateStatus('连接失败，请刷新页面后重试', 'error', '🔄');
      } else if (error.message.includes('页面脚本加载失败')) {
        this.updateStatus('页面脚本加载失败，请刷新页面后重试', 'error', '🔄');
      } else {
        this.updateStatus(`提取失败: ${error.message}`, 'error', '❌');
      }
    }
  }

  // 显示商品信息
  displayProductInfo(data) {
    const productInfo = document.getElementById('productInfo');
    
    document.getElementById('productTitle').textContent = data.title || '未知商品';
    document.getElementById('productPrice').textContent = 
      data.price ? `${data.currency || ''} ${data.price}` : '未获取到';
    document.getElementById('productBrand').textContent = data.brand || '未知品牌';
    document.getElementById('productDomain').textContent = data.domain || '未知网站';
    document.getElementById('extractionMethod').textContent = 
      data.extractionMethod === 'schema+selectors' ? 'Schema.org + 选择器' : '选择器匹配';
    
    productInfo.classList.remove('hidden');
  }

  // 显示提取统计
  showExtractionStats(data) {
    const statsContainer = document.getElementById('extractionStats');
    const imageCount = document.getElementById('imageCount');
    const specCount = document.getElementById('specCount');
    
    imageCount.textContent = (data.images || []).length;
    specCount.textContent = (data.specifications || []).length;
    
    statsContainer.classList.remove('hidden');
  }

  // 切换预览显示
  togglePreview() {
    const previewContainer = document.getElementById('previewContainer');
    const previewBtn = document.getElementById('previewBtn');
    const previewText = document.getElementById('previewText');
    
    if (previewContainer.classList.contains('hidden')) {
      previewContainer.textContent = this.currentMarkdown;
      previewContainer.classList.remove('hidden');
      previewText.textContent = '隐藏预览';
    } else {
      previewContainer.classList.add('hidden');
      previewText.textContent = '预览Markdown';
    }
  }

  // 下载Markdown文件
  async downloadMarkdown() {
    if (!this.currentMarkdown) {
      this.updateStatus('没有可下载的内容', 'error', '❌');
      return;
    }

    try {
      const productTitle = this.currentProductData?.title || '商品详情';
      // 清理文件名中的特殊字符
      const sanitizedTitle = productTitle
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      const domain = this.currentProductData?.domain || 'unknown';
      const filename = `${sanitizedTitle}_${domain}_${timestamp}.md`;

      // 发送下载请求到后台脚本
      const response = await chrome.runtime.sendMessage({
        action: 'downloadMarkdown',
        content: this.currentMarkdown,
        filename: filename
      });

      if (response.success) {
        this.updateStatus('Markdown文件下载成功！', 'success', '📁');
        
        // 显示下载成功动画
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          downloadBtn.style.transform = '';
        }, 150);
      } else {
        throw new Error(response.error || '下载失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      
      // 如果下载失败，提供复制到剪贴板的选项
      this.updateStatus(`下载失败: ${error.message}`, 'error', '❌');
      
      // 3秒后提示用户可以尝试复制功能
      setTimeout(() => {
        this.updateStatus('下载失败，可尝试预览后手动复制', '', '📋');
        // 自动展开预览
        const previewContainer = document.getElementById('previewContainer');
        const previewText = document.getElementById('previewText');
        if (previewContainer.classList.contains('hidden')) {
          previewContainer.textContent = this.currentMarkdown;
          previewContainer.classList.remove('hidden');
          previewText.textContent = '隐藏预览';
        }
      }, 3000);
    }
  }

  // 复制到剪贴板（备用功能）
  async copyToClipboard() {
    if (!this.currentMarkdown) {
      this.updateStatus('没有可复制的内容', 'error', '❌');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.currentMarkdown);
      this.updateStatus('内容已复制到剪贴板！', 'success', '📋');
      
      // 显示复制成功动画
      const copyBtn = document.getElementById('copyBtn');
      copyBtn.style.transform = 'scale(0.95)';
      copyBtn.style.background = 'rgba(34, 197, 94, 0.3)';
      setTimeout(() => {
        copyBtn.style.transform = '';
        copyBtn.style.background = '';
      }, 300);
    } catch (error) {
      console.error('复制失败:', error);
      
      // 如果现代API失败，尝试旧方法
      try {
        // 创建临时文本区域
        const textarea = document.createElement('textarea');
        textarea.value = this.currentMarkdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        this.updateStatus('内容已复制到剪贴板！', 'success', '📋');
      } catch (fallbackError) {
        console.error('备用复制方法也失败:', fallbackError);
        this.updateStatus('复制失败，请手动复制预览内容', 'error', '❌');
        
        // 自动展开预览让用户手动复制
        const previewContainer = document.getElementById('previewContainer');
        const previewText = document.getElementById('previewText');
        if (previewContainer.classList.contains('hidden')) {
          previewContainer.textContent = this.currentMarkdown;
          previewContainer.classList.remove('hidden');
          previewText.textContent = '隐藏预览';
        }
      }
    }
  }

  // 获取当前页面的基本信息
  async getCurrentPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return {
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl
      };
    } catch (error) {
      return null;
    }
  }
}

// 当popup加载完成时初始化控制器
document.addEventListener('DOMContentLoaded', () => {
  console.log('独立站商品详情提取器 Popup 已加载');
  new IndependentStorePopupController();
});

// 处理popup关闭前的清理
window.addEventListener('beforeunload', () => {
  console.log('Popup 正在关闭');
});