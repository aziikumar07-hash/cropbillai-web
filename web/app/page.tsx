import Cinematic from '../components/cinematic/Cinematic';
import SnapBillDemo from '../components/demo/SnapBillDemo';
import CategoryCarousel from '../components/carousel/CategoryCarousel';
import SampleDashboard from '../components/dashboard/SampleDashboard';
import Finale from '../components/finale/Finale';
import WaitlistForm from '../components/waitlist/WaitlistForm';
import { Footer } from '../components/Brand';
const data={ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'CropBillAI', url: 'https://cropbillai.me', logo: 'https://cropbillai.me/apple-touch-icon.png' },{ '@type': 'WebSite', name: 'CropBillAI', url: 'https://cropbillai.me' }] };
export default function Home() {
  return <><main id="main" tabIndex={-1}><Cinematic/><SnapBillDemo/><CategoryCarousel/><SampleDashboard/><Finale/><WaitlistForm/></main><Footer/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}/></>;
}
