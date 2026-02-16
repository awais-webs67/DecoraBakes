import HeroSlider from '../components/HeroSlider'
import TrustFeatures from '../components/TrustFeatures'
import FeaturedProducts from '../components/FeaturedProducts'
import CategoryCircles from '../components/CategoryCircles'
import ProductGrid from '../components/ProductGrid'
import PromoSection from '../components/PromoSection'
import Testimonials from '../components/Testimonials'
import { useSEO } from '../hooks/useSEO'

function Home() {
    useSEO({
        title: 'Premium Cake Decorating Supplies',
        description: "Australia's #1 online store for premium cake decorating supplies, baking tools, fondant, edible decorations & more. Free shipping on orders over $149.",
        url: '/',
        type: 'website',
        image: '/logo.png'
    })

    return (
        <div className="home-page">
            <HeroSlider />
            <TrustFeatures />
            <FeaturedProducts />
            <CategoryCircles />
            <ProductGrid title="Latest Products" limit={8} />
            <PromoSection />
            <Testimonials />
        </div>
    )
}

export default Home


