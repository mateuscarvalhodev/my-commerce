import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poltica de Cookies - FitStyle",
};

export default function CookiesPage() {
  return (
    <article className="prose prose-sm prose-neutral max-w-none">
      <h1>Poltica de Cookies</h1>
      <p><strong>ltima atualizao:</strong> abril de 2026</p>

      <p>
        Esta poltica explica como a FitStyle utiliza cookies e tecnologias
        semelhantes para reconhec-lo quando voc visita nosso site.
      </p>

      <h2>1. O que so cookies?</h2>
      <p>
        Cookies so pequenos arquivos de texto armazenados no seu navegador quando
        voc visita um site. Eles permitem que o site se lembre das suas aes e
        preferencias ao longo do tempo.
      </p>

      <h2>2. Cookies que utilizamos</h2>

      <h3>Cookies essenciais</h3>
      <p>Necessrios para o funcionamento do site. No podem ser desativados.</p>
      <ul>
        <li>
          <strong>Sesso de autenticao:</strong> mantm voc logado durante a
          navegao. Gerenciado pelo Supabase Auth.
        </li>
        <li>
          <strong>Carrinho de compras:</strong> armazena os itens do seu carrinho
          localmente (localStorage) para que no sejam perdidos ao navegar.
        </li>
      </ul>

      <h3>Cookies de preferncia</h3>
      <p>Armazenam suas escolhas para melhorar a experincia.</p>
      <ul>
        <li>
          <strong>Preferncia da sidebar:</strong> lembra se o menu lateral estava
          aberto ou fechado.
        </li>
        <li>
          <strong>Consentimento de cookies:</strong> registra sua escolha sobre
          aceitar ou recusar cookies.
        </li>
      </ul>

      <h2>3. Cookies de terceiros</h2>
      <p>
        Atualmente no utilizamos cookies de terceiros para anlise ou marketing.
        Caso venhamos a utilizar no futuro, atualizaremos esta poltica e
        solicitaremos seu consentimento.
      </p>

      <h2>4. Como gerenciar cookies</h2>
      <p>
        Voc pode gerenciar seus cookies de duas formas:
      </p>
      <ul>
        <li>
          <strong>Banner de consentimento:</strong> ao acessar o site pela primeira vez,
          voc pode aceitar ou recusar cookies no essenciais.
        </li>
        <li>
          <strong>Configuraes do navegador:</strong> a maioria dos navegadores permite
          bloquear ou excluir cookies. Consulte a documentao do seu navegador.
        </li>
      </ul>
      <p>
        Desativar cookies essenciais pode comprometer o funcionamento do site,
        como manter o login ou o carrinho de compras.
      </p>

      <h2>5. Base legal</h2>
      <p>
        O uso de cookies essenciais est amparado pelo legtimo interesse para
        garantir o funcionamento do site. Cookies de preferncia e anlise so
        baseados no seu consentimento, conforme a LGPD (Lei n 13.709/2018).
      </p>

      <h2>6. Contato</h2>
      <p>
        Dvidas sobre nossa poltica de cookies podem ser enviadas para:{" "}
        <strong>privacidade@fitstyle.com.br</strong>.
      </p>
    </article>
  );
}
