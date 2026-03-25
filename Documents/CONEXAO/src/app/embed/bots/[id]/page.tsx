// Redireciona para o `BotDetailsPage` existente para evitiar duplicação de lógicas.
// Como ele é um client component e já usa useParams, vai funcionar nativamente.
import BotDetailsPage from "@/app/dashboard/bots/[id]/page";

// Exportamos o componente exatamente como está
export default BotDetailsPage;
