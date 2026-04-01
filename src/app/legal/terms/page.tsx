import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso - FitStyle",
};

export default function TermsPage() {
  return (
    <article className="prose prose-sm prose-neutral max-w-none">
      <h1>Termos de Uso</h1>
      <p><strong>ltima atualizao:</strong> abril de 2026</p>

      <p>
        Ao acessar e utilizar o site FitStyle, voc concorda com os termos e
        condies descritos abaixo. Caso no concorde, pedimos que no utilize
        nossos servios.
      </p>

      <h2>1. Sobre a FitStyle</h2>
      <p>
        A FitStyle  uma loja virtual especializada em roupas e acessrios de moda.
        Oferecemos produtos prprios e de marcas parceiras, com entrega em todo o Brasil.
      </p>

      <h2>2. Cadastro e conta</h2>
      <ul>
        <li>Voc pode navegar e comprar como visitante (checkout como convidado) ou criar uma conta.</li>
        <li>Ao criar uma conta, voc  responsvel por manter a segurana das suas credenciais.</li>
        <li>Informaes falsas ou incompletas podem resultar no cancelamento da conta.</li>
      </ul>

      <h2>3. Produtos e preos</h2>
      <ul>
        <li>Os preos so apresentados em Reais (BRL) e podem ser alterados sem aviso prvio.</li>
        <li>As imagens dos produtos so ilustrativas e podem apresentar pequenas variaes de cor.</li>
        <li>A disponibilidade de estoque  atualizada em tempo real, mas no garantida at a confirmao do pagamento.</li>
      </ul>

      <h2>4. Pagamentos</h2>
      <ul>
        <li>Aceitamos pagamentos via PIX e carto de crdito.</li>
        <li>Pagamentos via PIX possuem desconto de 10% e so confirmados automaticamente.</li>
        <li>O processamento dos pagamentos  realizado pela AbacatePay, nosso parceiro de pagamentos.</li>
      </ul>

      <h2>5. Entregas</h2>
      <ul>
        <li>As entregas so realizadas pelos Correios (SEDEX e PAC).</li>
        <li>O prazo de entrega  contado a partir da confirmao do pagamento.</li>
        <li>Pedidos acima do valor mnimo configurado possuem frete grtis.</li>
      </ul>

      <h2>6. Trocas e devolues</h2>
      <ul>
        <li>Voc pode solicitar a troca ou devoluo em at 7 dias aps o recebimento, conforme o Cdigo de Defesa do Consumidor.</li>
        <li>O produto deve estar em perfeito estado, sem uso, com etiquetas e embalagem original.</li>
        <li>Para solicitar, acesse &ldquo;Meus Pedidos&rdquo; na sua conta ou entre em contato conosco.</li>
      </ul>

      <h2>7. Cupons de desconto</h2>
      <ul>
        <li>Cupons possuem regras especficas de validade, valor mnimo e limite de uso.</li>
        <li>No  possvel acumular cupons em um mesmo pedido.</li>
        <li>A FitStyle reserva-se o direito de cancelar cupons utilizados de forma indevida.</li>
      </ul>

      <h2>8. Propriedade intelectual</h2>
      <p>
        Todo o contedo do site (textos, imagens, logotipos, layout) pertence  FitStyle
        e  protegido por leis de propriedade intelectual. A reproduo sem autorizao
         proibida.
      </p>

      <h2>9. Limitao de responsabilidade</h2>
      <p>
        A FitStyle no se responsabiliza por danos indiretos decorrentes do uso do site,
        incluindo interrupes de servio, falhas tcnicas ou atrasos causados por terceiros.
      </p>

      <h2>10. Legislao aplicvel</h2>
      <p>
        Estes termos so regidos pelas leis da Repblica Federativa do Brasil. Eventuais
        disputas sero resolvidas no foro da comarca do domiclio do consumidor.
      </p>
    </article>
  );
}
