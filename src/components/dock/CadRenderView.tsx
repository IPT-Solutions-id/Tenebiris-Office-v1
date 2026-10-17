import React, { useState } from 'react';
import {
  Globe,
  Plus,
  X,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Smartphone,
  Laptop,
  Download,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Upload,
  CheckCircle2,
  Code2,
  Layout,
  Play
} from 'lucide-react';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  type: 'web_sandbox' | 'mobile_apk' | 'png_viewer' | 'api_inspector';
  imageUrl?: string;
  imageName?: string;
  imageSize?: string;
}

const INITIAL_TABS: BrowserTab[] = [
  {
    id: 'tab-1',
    title: 'Local Sandbox App',
    url: 'http://localhost:3000/',
    type: 'web_sandbox',
  },
  {
    id: 'tab-2',
    title: 'Mobile APK View',
    url: 'http://localhost:3000/mobile-preview',
    type: 'mobile_apk',
  },
  {
    id: 'tab-3',
    title: 'Blueprint_Room_6000.png',
    url: 'asset://images/blueprint_room_6000.png',
    type: 'png_viewer',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    imageName: 'blueprint_room_6000.png',
    imageSize: '2.4 MB (4000x3000 px)',
  },
  {
    id: 'tab-4',
    title: 'Occult UI Assets.png',
    url: 'asset://images/occult_ui_assets.png',
    type: 'png_viewer',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    imageName: 'occult_ui_assets.png',
    imageSize: '1.8 MB (1920x1080 px)',
  },
];

export const CadRenderView: React.FC = () => {
  const [tabs, setTabs] = useState<BrowserTab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [urlInput, setUrlInput] = useState<string>('http://localhost:3000/');
  const [zoom, setZoom] = useState<number>(1);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [notification, setNotification] = useState<string | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleTabSwitch = (tab: BrowserTab) => {
    setActiveTabId(tab.id);
    setUrlInput(tab.url);
  };

  const handleAddNewTab = (type: BrowserTab['type'] = 'web_sandbox') => {
    const newId = `tab-${Date.now()}`;
    let newTitle = 'New Sandbox';
    let newUrl = 'http://localhost:3000/new-route';

    if (type === 'png_viewer') {
      newTitle = 'Uploaded Image.png';
      newUrl = 'asset://images/uploaded_sample.png';
    } else if (type === 'mobile_apk') {
      newTitle = 'Mobile APK Preview';
      newUrl = 'http://localhost:3000/apk-run';
    }

    const newTab: BrowserTab = {
      id: newId,
      title: newTitle,
      url: newUrl,
      type,
      imageUrl: type === 'png_viewer' ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80' : undefined,
      imageName: type === 'png_viewer' ? 'uploaded_sample.png' : undefined,
      imageSize: type === 'png_viewer' ? '1.2 MB (1280x720 px)' : undefined,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setUrlInput(newUrl);
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length <= 1) return; // Keep at least one tab
    const nextTabs = tabs.filter(t => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
      setUrlInput(nextTabs[nextTabs.length - 1].url);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTabs(tabs.map(t => (t.id === activeTabId ? { ...t, url: urlInput, title: urlInput.replace(/^https?:\/\//, '') } : t)));
    showNotification(`Navigated to ${urlInput}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resUrl = uploadEvent.target?.result as string;
        const newTab: BrowserTab = {
          id: `tab-file-${Date.now()}-${index}`,
          title: file.name,
          url: `file://local/${file.name}`,
          type: file.type.includes('image') ? 'png_viewer' : 'web_sandbox',
          imageUrl: file.type.includes('image') ? resUrl : undefined,
          imageName: file.name,
          imageSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setUrlInput(newTab.url);
        showNotification(`Loaded ${file.name} into Preview Browser`);
      };
      if (file.type.includes('image')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#09090F] font-mono text-xs select-none overflow-hidden">
      {/* Top Multi-Tab Bar */}
      <div className="flex items-center justify-between border-b border-[#9E172C]/40 bg-[#0E0C16] px-2 pt-1 shrink-0 gap-1 overflow-x-auto">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => handleTabSwitch(tab)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-t border-t border-x cursor-pointer transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#14121C] text-[#E8E4E9] border-[#9E172C] shadow-[0_-2px_6px_rgba(215,38,61,0.2)]'
                    : 'bg-[#09090F]/60 text-[#7A7280] border-transparent hover:text-[#A69EA9] hover:bg-[#14121C]/50'
                }`}
              >
                {tab.type === 'png_viewer' ? (
                  <ImageIcon className={`w-3 h-3 ${isActive ? 'text-[#39C5CF]' : 'text-[#7A7280]'}`} />
                ) : tab.type === 'mobile_apk' ? (
                  <Smartphone className={`w-3 h-3 ${isActive ? 'text-[#D7263D]' : 'text-[#7A7280]'}`} />
                ) : (
                  <Globe className={`w-3 h-3 ${isActive ? 'text-[#C69245]' : 'text-[#7A7280]'}`} />
                )}
                <span className="text-[10px] font-medium truncate max-w-[120px]" title={tab.title}>
                  {tab.title}
                </span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="p-0.5 rounded-full hover:bg-[#490D1B] text-[#7A7280] hover:text-[#E8E4E9]"
                    title="Close Tab"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Tab & Upload Buttons */}
        <div className="flex items-center space-x-1 shrink-0 pl-2">
          <label
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#A69EA9] hover:text-[#E8E4E9] border border-[#9E172C]/40 cursor-pointer text-[10px]"
            title="Upload PNG / Web File"
          >
            <Upload className="w-3 h-3 text-[#39C5CF]" />
            <span className="hidden sm:inline">Upload File</span>
            <input type="file" onChange={handleFileUpload} multiple accept="image/png,image/jpeg,image/webp,.html,.json,.js" className="hidden" />
          </label>

          <button
            onClick={() => handleAddNewTab('web_sandbox')}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C]/40"
            title="Open New Sandbox Tab"
          >
            <Plus className="w-3.5 h-3.5 text-[#D7263D]" />
          </button>
        </div>
      </div>

      {/* URL Browser Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[#9E172C]/30 bg-[#0E0C16] px-2.5 py-1.5 shrink-0 gap-2">
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => showNotification('Reloaded current preview')}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#A69EA9] hover:text-[#E8E4E9]"
            title="Reload Page"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => showNotification('History back')}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#7A7280] hover:text-[#A69EA9]"
            title="Back"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => showNotification('History forward')}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#7A7280] hover:text-[#A69EA9]"
            title="Forward"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-0.5 mx-2">
          <Globe className="w-3 h-3 text-[#39C5CF] mr-1.5 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-transparent text-[#E8E4E9] focus:outline-none font-mono text-[10.5px]"
            placeholder="Enter URL or file path..."
          />
        </form>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setDeviceMode(deviceMode === 'desktop' ? 'mobile' : 'desktop')}
            className={`px-2 py-0.5 rounded border text-[10px] flex items-center space-x-1 ${
              deviceMode === 'mobile' ? 'bg-[#9E172C] text-[#E8E4E9] border-[#D7263D]' : 'bg-[#14121C] text-[#A69EA9] border-[#9E172C]/40'
            }`}
            title="Toggle Device Frame"
          >
            {deviceMode === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
            <span className="hidden md:inline">{deviceMode === 'mobile' ? 'Mobile' : 'Desktop'}</span>
          </button>

          <button
            onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#E8E4E9]"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#E8E4E9]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Browser Viewport Body */}
      <div className="flex-1 w-full min-h-0 overflow-auto bg-[#09090F] p-3 flex items-center justify-center relative">
        {notification && (
          <div className="absolute top-2 right-2 z-30 bg-[#14121C] border border-[#39C5CF] text-[#39C5CF] px-3 py-1 rounded shadow-lg flex items-center space-x-1.5 animate-fade-in text-[10.5px]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div
          className={`transition-all duration-200 flex items-center justify-center w-full h-full ${
            deviceMode === 'mobile'
              ? 'max-w-[360px] h-[90%] bg-[#0E0C16] border-4 border-[#332A42] rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col my-auto'
              : 'w-full h-full'
          }`}
          style={{ transform: `scale(${zoom})` }}
        >
          {activeTab.type === 'png_viewer' ? (
            /* PNG Image Viewer Mode */
            <div className="w-full h-full flex flex-col bg-[#0E0C16] border border-[#9E172C]/40 rounded-lg overflow-hidden">
              <div className="bg-[#14121C] border-b border-[#9E172C]/30 px-3 py-1 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-2 truncate">
                  <ImageIcon className="w-3.5 h-3.5 text-[#39C5CF] shrink-0" />
                  <span className="font-bold text-[#E8E4E9] truncate">{activeTab.imageName || activeTab.title}</span>
                  <span className="text-[#7A7280]">({activeTab.imageSize || 'PNG Asset'})</span>
                </div>
                <button
                  onClick={() => showNotification(`Exported ${activeTab.imageName || 'image'}`)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4 bg-[#09090F] overflow-auto">
                <img
                  src={activeTab.imageUrl || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'}
                  alt={activeTab.title}
                  className="max-w-full max-h-full object-contain rounded border border-[#9E172C]/30 shadow-[0_0_20px_rgba(0,0,0,0.7)]"
                />
              </div>
            </div>
          ) : (
            /* Web Sandbox / APK Preview Mode */
            <div className="w-full h-full flex flex-col bg-[#0E0C16] border border-[#9E172C]/40 rounded-lg overflow-hidden">
              <div className="bg-[#14121C] border-b border-[#9E172C]/30 px-3 py-1 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D7263D]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C69245]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#39C5CF]"></div>
                  </div>
                  <span className="text-[#A69EA9] font-mono truncate">{activeTab.url}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-[#490D1B] text-[#D7263D] font-bold text-[9px]">
                  LIVE SANDBOX
                </span>
              </div>

              {/* Sandbox App UI Mock Content */}
              <div className="flex-1 p-6 overflow-y-auto bg-[#09090F] flex flex-col items-center justify-center text-center">
                <div className="max-w-md w-full bg-[#14121C] border border-[#9E172C]/50 rounded-xl p-6 shadow-[0_0_25px_rgba(215,38,61,0.15)] flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#490D1B] flex items-center justify-center border border-[#9E172C]">
                    <Code2 className="w-6 h-6 text-[#D7263D]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#E8E4E9] font-serif tracking-wider">TENEBIRIS LOCAL SANDBOX</h2>
                    <p className="text-[11px] text-[#A69EA9] mt-1">
                      Previewing live web & APK state for URL: <span className="text-[#39C5CF]">{activeTab.url}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <button
                      onClick={() => showNotification('Compiled test build successfully')}
                      className="py-2 px-3 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(215,38,61,0.3)]"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Test Run App</span>
                    </button>
                    <button
                      onClick={() => handleAddNewTab('png_viewer')}
                      className="py-2 px-3 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C]/40 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#39C5CF]" />
                      <span>Open PNG View</span>
                    </button>
                  </div>

                  <div className="w-full bg-[#0E0C16] border border-[#9E172C]/30 rounded p-3 text-left font-mono text-[10px] text-[#7A7280] space-y-1">
                    <div className="text-[#C69245] font-bold flex items-center justify-between">
                      <span>STATUS: RUNNING LOCAL</span>
                      <span className="text-[#39C5CF]">HMR: ACTIVE</span>
                    </div>
                    <div>&gt; Vite dev server ready on port 3000</div>
                    <div>&gt; Hermes gateway listening for changes...</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
