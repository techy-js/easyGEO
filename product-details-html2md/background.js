// 独立站电商商品详情提取器 - 后台脚本
class IndependentStoreBackground {
  constructor() {
    this.init();
  }

  init() {
    // 扩展安装时的初始化
    chrome.runtime.onInstalled.addListener(() => {
      console.log('独立站电商商品详情提取器已安装');
      this.setDefaultSettings();
    });

    // 监听消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // 监听标签页激活
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });
  }

  // 设置默认配置
  async setDefaultSettings() {
    const defaultSettings = {
      autoDetection: true,
      schemaPreference: true,
      maxImages: 10,
      maxSpecs: 20,
      includeMetadata: true,
      downloadFormat: 'markdown'
    };

    try {
      const existingSettings = await chrome.storage.sync.get('settings');
      if (!existingSettings.settings) {
        await chrome.storage.sync.set({ settings: defaultSettings });
        console.log('默认设置已保存');
      }
    } catch (error) {
      console.error('设置默认配置失败:', error);
    }
  }

  // 处理消息
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'downloadMarkdown':
          await this.handleDownloadMarkdown(request, sendResponse);
          break;
        case 'saveSettings':
          await this.handleSaveSettings(request, sendResponse);
          break;
        case 'getSettings':
          await this.handleGetSettings(sendResponse);
          break;
        case 'clearCache':
          await this.handleClearCache(sendResponse);
          break;
        default:
          sendResponse({ success: false, error: '未知操作' });
      }
    } catch (error) {
      console.error('处理消息失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 处理Markdown文件下载
  async handleDownloadMarkdown(request, sendResponse) {
    const { content, filename } = request;
    
    if (!content || !filename) {
      sendResponse({ success: false, error: '缺少必要参数' });
      return;
    }

    try {
      // 使用Data URL方式创建下载链接，更兼容
      const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(content);
      
      // 下载文件
      const downloadId = await chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      });

      sendResponse({ 
        success: true, 
        downloadId: downloadId,
        message: '文件下载成功'
      });

      console.log(`文件下载成功: ${filename}`);
    } catch (error) {
      console.error('下载失败:', error);
      
      // 如果Data URL方式也失败，尝试使用Blob URL方式
      try {
        console.log('尝试使用Blob URL方式...');
        
        // 检查是否支持URL.createObjectURL
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          const blob = new Blob([content], { 
            type: 'text/markdown;charset=utf-8' 
          });
          const blobUrl = URL.createObjectURL(blob);
          
          const downloadId = await chrome.downloads.download({
            url: blobUrl,
            filename: filename,
            saveAs: true
          });

          // 清理URL
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 1000);

          sendResponse({ 
            success: true, 
            downloadId: downloadId,
            message: '文件下载成功(Blob方式)'
          });
          
          console.log(`文件下载成功(Blob方式): ${filename}`);
          return;
        }
        
        throw new Error('URL.createObjectURL不可用');
      } catch (blobError) {
        console.error('Blob方式也失败:', blobError);
        sendResponse({ 
          success: false, 
          error: `下载失败: ${error.message}。请尝试复制内容手动保存。` 
        });
      }
    }
  }

  // 保存设置
  async handleSaveSettings(request, sendResponse) {
    try {
      await chrome.storage.sync.set({ settings: request.settings });
      sendResponse({ success: true, message: '设置已保存' });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // 获取设置
  async handleGetSettings(sendResponse) {
    try {
      const result = await chrome.storage.sync.get('settings');
      sendResponse({ success: true, settings: result.settings || {} });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // 清理缓存
  async handleClearCache(sendResponse) {
    try {
      await chrome.storage.local.clear();
      sendResponse({ success: true, message: '缓存已清理' });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // 处理标签页更新
  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status !== 'complete' || !tab.url) return;

    // 跳过chrome内部页面
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      this.setBadge(tabId, '', '');
      return;
    }

    // 检测是否可能是商品页面
    const isLikelyProductPage = this.detectProductPage(tab);
    
    if (isLikelyProductPage.isProduct) {
      // 显示绿色圆点表示检测到商品页面
      this.setBadge(tabId, '●', '#22c55e');
    } else if (isLikelyProductPage.isPossible) {
      // 显示黄色圆点表示可能是商品页面
      this.setBadge(tabId, '●', '#f59e0b');
    } else {
      // 清除徽章
      this.setBadge(tabId, '', '');
    }
  }

  // 处理标签页激活
  async handleTabActivated(activeInfo) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      this.handleTabUpdate(activeInfo.tabId, { status: 'complete' }, tab);
    } catch (error) {
      console.error('处理标签页激活失败:', error);
    }
  }

  // 检测是否是商品页面
  detectProductPage(tab) {
    if (!tab.url || !tab.title) {
      return { isProduct: false, isPossible: false };
    }

    const url = tab.url.toLowerCase();
    const title = tab.title.toLowerCase();

    // 强商品页面特征
    const strongProductIndicators = [
      '/product/', '/item/', '/goods/', '/p/',
      'product-detail', 'item-detail', 'product_detail',
      'products/', '/shop/', '/store/'
    ];

    // 弱商品页面特征
    const weakProductIndicators = [
      'buy', 'shop', 'store', 'price', '$', '¥', '€', '£',
      'cart', 'checkout', 'purchase', 'order',
      '购买', '商店', '商品', '价格', '元', '折扣', '促销',
      'add to cart', 'buy now', '立即购买', '加入购物车'
    ];

    const hasStrongIndicator = strongProductIndicators.some(indicator => 
      url.includes(indicator)
    );

    const hasWeakIndicator = weakProductIndicators.some(indicator => 
      url.includes(indicator) || title.includes(indicator)
    );

    return {
      isProduct: hasStrongIndicator,
      isPossible: !hasStrongIndicator && hasWeakIndicator,
      confidence: hasStrongIndicator ? 0.9 : (hasWeakIndicator ? 0.4 : 0.1)
    };
  }

  // 设置徽章
  setBadge(tabId, text, color) {
    chrome.action.setBadgeText({
      text: text,
      tabId: tabId
    });
    
    if (color) {
      chrome.action.setBadgeBackgroundColor({
        color: color,
        tabId: tabId
      });
    }
  }

  // 记录使用统计
  async logUsage(action, data = {}) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        action,
        data,
        version: chrome.runtime.getManifest().version
      };

      // 获取现有日志
      const result = await chrome.storage.local.get('usageLogs');
      const logs = result.usageLogs || [];
      
      // 添加新日志
      logs.push(logEntry);
      
      // 只保留最近100条记录
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      // 保存日志
      await chrome.storage.local.set({ usageLogs: logs });
    } catch (error) {
      console.error('记录使用统计失败:', error);
    }
  }
}

// 初始化后台脚本
const backgroundService = new IndependentStoreBackground();

// 全局错误处理
self.addEventListener('error', (event) => {
  console.error('后台脚本错误:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});