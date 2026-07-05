import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Not: StrictMode kasitli olarak devre disi. React 19'un gelistirme modu
// mount->unmount->remount davranisi, framer-motion giris animasyonlarinin
// (orn. BrandHeader) bozulup metnin animasyonsuz aniden belirmesine yol aciyordu.
createRoot(document.getElementById('root')).render(<App />)
