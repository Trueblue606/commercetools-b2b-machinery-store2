// components/ProductDownloads.js
import { useState } from 'react';

const ProductDownloads = ({ productId, downloads = [] }) => {
  const [downloading, setDownloading] = useState({});

  // Default downloads for demo (you can remove this when you have real data)
  const defaultDownloads = [
    {
      id: '1',
      name: 'Product Manual',
      description: 'Complete installation and operation manual',
      type: 'manual',
      fileSize: '2.4 MB',
      format: 'PDF',
      url: '/downloads/manuals/product-manual.pdf',
      icon: '📖'
    },
    {
      id: '2',
      name: 'Technical Specifications',
      description: 'Detailed technical specifications and dimensions',
      type: 'specification',
      fileSize: '856 KB',
      format: 'PDF',
      url: '/downloads/specs/tech-specs.pdf',
      icon: '📊'
    },
    {
      id: '3',
      name: '3D CAD Model',
      description: 'AutoCAD model file for integration planning',
      type: 'cad',
      fileSize: '15.2 MB',
      format: 'DWG',
      url: '/downloads/cad/3d-model.dwg',
      icon: '🔧'
    },
    {
      id: '4',
      name: 'Installation Guide',
      description: 'Step-by-step installation instructions',
      type: 'guide',
      fileSize: '1.8 MB',
      format: 'PDF',
      url: '/downloads/guides/installation-guide.pdf',
      icon: '⚙️'
    },
    {
      id: '5',
      name: 'Safety Data Sheet',
      description: 'Material safety and handling information',
      type: 'safety',
      fileSize: '425 KB',
      format: 'PDF',
      url: '/downloads/safety/safety-data-sheet.pdf',
      icon: '⚠️'
    }
  ];

  const availableDownloads = downloads.length > 0 ? downloads : defaultDownloads;

  const handleDownload = async (download) => {
    const downloadId = download.id;
    setDownloading(prev => ({ ...prev, [downloadId]: true }));

    try {
      // Track download analytics
      console.log(`Download started: ${download.name} for product ${productId}`);
      
      // For demo purposes, we'll simulate a download
      // In real implementation, you'd fetch from your file storage
      setTimeout(() => {
        // Create a temporary download link
        const link = document.createElement('a');
        link.href = download.url;
        link.download = `${download.name.replace(/\s+/g, '-').toLowerCase()}.${download.format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloading(prev => ({ ...prev, [downloadId]: false }));
      }, 1500); // Simulate download time

      // In production, you might want to:
      // 1. Log the download in your analytics
      // 2. Check user permissions
      // 3. Serve files from secure storage (AWS S3, etc.)
      // 4. Track download counts
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
      setDownloading(prev => ({ ...prev, [downloadId]: false }));
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      manual: '#3b82f6',
      specification: '#10b981',
      cad: '#f59e0b',
      guide: '#8b5cf6',
      safety: '#ef4444',
      default: '#6b7280'
    };
    return colors[type] || colors.default;
  };

  const getTypeLabel = (type) => {
    const labels = {
      manual: 'Manual',
      specification: 'Specs',
      cad: 'CAD',
      guide: 'Guide',
      safety: 'Safety',
      default: 'Document'
    };
    return labels[type] || labels.default;
  };

  if (availableDownloads.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginBottom: '32px',
      padding: '24px',
      backgroundColor: '#f8fafe',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#0d2340',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
        </div>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#0d2340',
            marginBottom: '4px'
          }}>
            Product Downloads
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Technical documents, manuals, and CAD files
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {availableDownloads.map((download) => {
          const isDownloading = downloading[download.id];
          
          return (
            <div
              key={download.id}
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#d7e9f7';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                {/* File Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: `${getTypeColor(download.type)}15`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  {download.icon}
                </div>

                {/* File Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#0d2340',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {download.name}
                    </h4>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: getTypeColor(download.type),
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      {getTypeLabel(download.type)}
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: '0 0 8px 0',
                    lineHeight: '1.4'
                  }}>
                    {download.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{download.format}</span>
                      <span>•</span>
                      <span>{download.fileSize}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(download)}
                      disabled={isDownloading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isDownloading ? '#9ca3af' : '#0d2340',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                      onMouseEnter={e => {
                        if (!isDownloading) {
                          e.currentTarget.style.backgroundColor = '#0a1c33';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isDownloading) {
                          e.currentTarget.style.backgroundColor = '#0d2340';
                        }
                      }}
                    >
                      {isDownloading ? (
                        <>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Download Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        border: '1px solid #bae6fd'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#0369a1',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          All downloads are free for registered customers. Files are provided for professional use only.
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProductDownloads;