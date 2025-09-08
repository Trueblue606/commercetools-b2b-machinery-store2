import { useState, useEffect } from "react";
export default function ProductImagesGallery({ images, selectedVariant }) {
  const [mainIndex, setMainIndex] = useState(0);

  const displayImages = selectedVariant?.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : (images || []);

  useEffect(() => {
    setMainIndex(0);
  }, [selectedVariant]);

  const prevImage = () => {
    setMainIndex((mainIndex - 1 + displayImages.length) % displayImages.length);
  };

  const nextImage = () => {
    setMainIndex((mainIndex + 1) % displayImages.length);
  };

  if (!displayImages || displayImages.length === 0) {
    return (
      <div style={{
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '16px'
      }}>
        No images available
      </div>
    );
  }

  return (
    <div>
      <div style={{
        position: 'relative',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src={displayImages[mainIndex].url}
          alt={displayImages[mainIndex].label || 'Product image'}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              style={{
                position: 'absolute',
                top: '50%',
                left: '16px',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                color: '#0a0a0a',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              style={{
                position: 'absolute',
                top: '50%',
                right: '16px',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                color: '#0a0a0a',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          overflowX: 'auto',
          padding: '4px'
        }}>
          {displayImages.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.label || `Thumbnail ${i + 1}`}
              onClick={() => setMainIndex(i)}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '4px',
                cursor: 'pointer',
                border: i === mainIndex ? '2px solid #0a0a0a' : '2px solid #e5e7eb',
                opacity: i === mainIndex ? 1 : 0.7,
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
