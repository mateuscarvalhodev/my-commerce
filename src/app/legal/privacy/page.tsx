import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poltica de Privacidade - FitStyle",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm prose-neutral max-w-none">
      <h1>Poltica de Privacidade</h1>
      <p><strong>ltima atualizao:</strong> abril de 2026</p>

      <p>
        A FitStyle (&ldquo;ns&rdquo;, &ldquo;nosso&rdquo;) valoriza a privacidade dos seus
        usurios. Esta poltica descreve como coletamos, usamos e protegemos
        suas informaes pessoais, em conformidade com a Lei Geral de Proteo
        de Dados (LGPD - Lei n 13.709/2018).
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><strong>Dados cadastrais:</strong> nome, e-mail e senha ao criar uma conta.</li>
        <li><strong>Dados de entrega:</strong> endereo completo (rua, nmero, bairro, cidade, estado, CEP).</li>
        <li><strong>Dados de pagamento:</strong> CPF/CNPJ para emisso de pagamentos via PIX ou boleto. No armazenamos dados de carto de crdito.</li>
        <li><strong>Dados de navegao:</strong> cookies de sesso e preferncia de navegao.</li>
        <li><strong>Dados de pedidos:</strong> histrico de compras, itens, valores e status.</li>
      </ul>

      <h2>2. Como usamos seus dados</h2>
      <ul>
        <li>Processar e entregar seus pedidos.</li>
        <li>Comunicar atualizaes sobre seus pedidos.</li>
        <li>Manter sua conta segura e autenticada.</li>
        <li>Melhorar nossos produtos e servios.</li>
        <li>Cumprir obrigaes legais e regulatrias.</li>
      </ul>

      <h2>3. Compartilhamento com terceiros</h2>
      <p>Compartilhamos dados apenas quando necessrio para a prestao do servio:</p>
      <ul>
        <li><strong>AbacatePay:</strong> processamento de pagamentos (nome, e-mail, CPF/CNPJ).</li>
        <li><strong>Correios:</strong> clculo e realizao de entregas (CEP e dimenses dos produtos).</li>
      </ul>
      <p>No vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</p>

      <h2>4. Armazenamento e segurana</h2>
      <p>
        Seus dados so armazenados em servidores seguros com criptografia em trnsito (TLS)
        e em repouso. Utilizamos o Supabase como provedor de infraestrutura, que
        segue padres internacionais de segurana.
      </p>

      <h2>5. Seus direitos (LGPD)</h2>
      <p>Voc tem direito a:</p>
      <ul>
        <li>Confirmar a existncia de tratamento dos seus dados.</li>
        <li>Acessar seus dados pessoais.</li>
        <li>Corrigir dados incompletos ou desatualizados.</li>
        <li>Solicitar a excluso dos seus dados pessoais.</li>
        <li>Revogar o consentimento a qualquer momento.</li>
      </ul>
      <p>
        Para exercer seus direitos, entre em contato pelo e-mail:{" "}
        <strong>privacidade@fitstyle.com.br</strong>.
      </p>

      <h2>6. Reteno de dados</h2>
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessrio
        para cumprir obrigaes legais (ex.: registros fiscais por 5 anos).
      </p>

      <h2>7. Alteraes nesta poltica</h2>
      <p>
        Podemos atualizar esta poltica periodicamente. Alteraes significativas sero
        comunicadas por e-mail ou aviso no site.
      </p>
    </article>
  );
}
