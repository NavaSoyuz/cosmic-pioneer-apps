document.addEventListener("DOMContentLoaded", () => {
    // スクロール時のフェードインアニメーション（Intersection Observer）
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // 15%見えたら発火
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                // 一度表示されたら監視を解除（再度スクロールしてもアニメーションさせない場合）
                // プレミアムな雰囲気を出すためには、またスクロールして戻ってきた時にもう一度動くように残しておく設定もアリです。今回は残します。
            } else {
                // スクロールして画面外に出たら再度アニメーションさせたい場合は外す
                entry.target.classList.remove('show');
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Navbarの背景透過コントロール
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 15, 0.9)';
            header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.5)';
        } else {
            header.style.background = 'rgba(10, 10, 15, 0.7)';
            header.style.boxShadow = 'none';
        }
    });
});
