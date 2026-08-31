import Spa from "@/src/spa-client"

// Все клиентские маршруты (кроме /api и статики) отдают SPA,
// а react-router разбирает путь на стороне клиента.
export default function CatchAll() {
  return <Spa />
}
