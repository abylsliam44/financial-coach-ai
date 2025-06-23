import Accounts from "../../components/dashboard/Accounts";

export default function AccountsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Счета</h1>
      <p className="text-gray-600 mb-6">Здесь вы можете добавить, редактировать или удалить свои банковские карты, кошельки и депозиты. Все балансы и операции будут синхронизированы.</p>
      <Accounts />
    </div>
  );
} 