import { motion, useDragControls } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useContactSettings } from '@/lib/contact';

export function FloatingWhatsapp() {
  const controls = useDragControls();
  const { getWhatsAppUrl } = useContactSettings();
  const message = 'Halo Luxury Massage Bali, saya ingin bertanya tentang layanan massage.';

  return (
    <motion.a
      href={getWhatsAppUrl(message)}
      target="_blank"
      rel="noreferrer"
      drag
      dragControls={controls}
      dragMomentum={false}
      dragElastic={0.08}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_38px_rgba(37,211,102,0.35)] ring-4 ring-[#25D366]/15 md:bottom-8"
      aria-label="Chat WhatsApp Luxury Massage Bali"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-dark bg-emerald-200 animate-pulse" />
    </motion.a>
  );
}
