// src/components/home/EditorialSpotlight.jsx

import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '../shared/Reveal'
import CoverFallback from '../shared/CoverFallback'

const EditorialSpotlight = ({ lounge }) => {
  return (
    <section className="rounded-2xl overflow-hidden bg-espresso">
      <div className="grid grid-cols-1 md:grid-cols-12">
        <Reveal className="md:col-span-5 relative min-h-[280px] md:min-h-[420px]">
          {lounge?.primaryImageUrl ? (
            <img src={lounge.primaryImageUrl} alt={lounge.name ? `Không gian ${lounge.name}` : ''} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <CoverFallback className="absolute inset-0 w-full h-full" />
          )}
        </Reveal>

        <Reveal delay={120} className="md:col-span-7 p-8 sm:p-10 md:p-14 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-on-dark mb-4">Triết lý âm học mộc</p>
          <blockquote className="font-display italic text-2xl sm:text-3xl leading-snug text-cream mb-6">
            &ldquo;Người đến phòng trà để lắng lại bên tách cà phê ấm và tiếng đàn mộc.&rdquo;
          </blockquote>
          <p className="text-cream-mute text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Từ những đêm Bolero rưng rưng đến khúc Trịnh ca một thời — mỗi tối tại các phòng trà độc
            lập khắp Sài Gòn là một trang hồi ức được mở lại, không khuếch đại điện tử, không vội vã.
            Chúng tôi tuyển chọn và kết nối bạn với những không gian ấy, không sở hữu riêng một quán nào.
          </p>
          {lounge?.id && (
            <Link to={`/lounge/${lounge.id}`}
              className="inline-flex items-center gap-2 self-start min-h-[44px] text-sm font-semibold text-brand-on-dark hover:text-cream transition-colors">
              Ghé thăm {lounge.name} <ArrowRight size={16} />
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  )
}

export default EditorialSpotlight
