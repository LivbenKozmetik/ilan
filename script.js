// Sample cosmetic products data
const products = [
    {
        id: 1,
        name: "Nemlendirici Krem",
        description: "Tüm cilt tipleri için uygun, 24 saat nem sağlayan lüks nemlendirici krem. Doğal çiçek ekstraktları içerir.",
        price: "₺149,90",
        emoji: "🌸"
    },
    {
        id: 2,
        name: "Mat Ruj Seti",
        description: "5 farklı renkte mat ruj seti. Uzun süre kalıcı ve kremsi doku. Günlük kullanım için idealdir.",
        price: "₺89,90",
        emoji: "💄"
    },
    {
        id: 3,
        name: "Göz Makyaj Temizleyici",
        description: "Hassas göz çevresi için özel formül. Waterproof makyajı bile kolayca temizler, tahriş yapmaz.",
        price: "₺59,90",
        emoji: "👁️"
    },
    {
        id: 4,
        name: "Yüz Serumu",
        description: "Vitamin C ve E içeren anti-aging serum. Cilt tonunu eşitler ve yaşlanma belirtilerini azaltır.",
        price: "₺199,90",
        emoji: "✨"
    },
    {
        id: 5,
        name: "Fondöten",
        description: "Orta-yoğun kapatıcılık sağlayan, doğal görünümlü fondöten. SPF 30 güneş koruması içerir.",
        price: "₺119,90",
        emoji: "🎨"
    },
    {
        id: 6,
        name: "Göz Farı Paleti",
        description: "12 renk göz farı paleti. Mat ve shimmer tonlar. Kolay karışan, uzun süre dayanıklı formül.",
        price: "₺79,90",
        emoji: "🌈"
    }
];

// Function to create product card HTML
function createProductCard(product) {
    return `
        <div class="product-card">
            <div class="product-image">
                ${product.emoji}
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${product.price}</div>
                <button class="product-btn" onclick="viewProduct(${product.id})">
                    Detayları Gör
                </button>
            </div>
        </div>
    `;
}

// Function to load products into the grid
function loadProducts() {
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        productGrid.innerHTML = products.map(product => createProductCard(product)).join('');
    }
}

// Function to handle product view (placeholder for future functionality)
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        alert(`${product.name} ürününü görüntülüyorsunuz!\n\nFiyat: ${product.price}\n\nAçıklama: ${product.description}`);
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    // Add a simple fade-in animation for product cards
    setTimeout(() => {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 * index);
            }, 100);
        });
    }, 100);
});