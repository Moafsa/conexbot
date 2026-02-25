export default function Footer() {
    return (
        <footer className="py-12 px-4 border-t border-white/5 bg-black/40">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                <div className="mb-4 md:mb-0">
                    <p>&copy; {new Date().getFullYear()} Conext Bot. Powered by Conext.click.</p>
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white transition-colors">Termos</a>
                    <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                    <a href="#" className="hover:text-white transition-colors">Suporte</a>
                </div>
            </div>
        </footer>
    );
}
