/**
 * Seed script for Supabase.
 *
 * Usage: npx tsx scripts/seed.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env manually (no dotenv dependency)
const envFile = readFileSync(".env", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log("🚀 Iniciando seed do banco...\n");

  // ═══════════════════════════════════════════════════════════════════════
  // STORE CONFIG
  // ═══════════════════════════════════════════════════════════════════════
  const { count: storeCount } = await supabase.from("store_config").select("*", { count: "exact", head: true });
  if (!storeCount) {
    console.log("🏪 Criando configuração da loja...");
    await supabase.from("store_config").insert({
      store_name: "FitStyle",
      legal_name: "FitStyle Comércio Digital LTDA",
      cnpj: "12.345.678/0001-90",
      email: "contato@fitstyle.com.br",
      phone: "(11) 99999-0000",
      address: { street: "Rua da Moda, 100", city: "São Paulo", state: "SP", zip_code: "01310-100" },
      primary_color: "#000000",
      logo_url: "https://picsum.photos/200/60?random=logo",
      return_policy: "Devoluções em até 7 dias corridos após o recebimento (CDC).",
    });
    console.log("✅ Configuração da loja criada!");
  } else {
    console.log("🏪 Configuração já existe, pulando...");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // USERS (via Supabase Auth Admin API)
  // ═══════════════════════════════════════════════════════════════════════
  const seedUsers = [
    { email: "admin@mycommerce.com", password: "admin123456", name: "Admin", role: "admin" },
    { email: "cliente@mycommerce.com", password: "cliente123456", name: "Cliente Teste", role: "customer" },
  ];

  for (const u of seedUsers) {
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", u.email).single();

    if (existing) {
      console.log(`👤 Usuário ${u.email} já existe, pulando...`);
      continue;
    }

    console.log(`👤 Criando usuário ${u.email}...`);

    // Create via Auth Admin API (bypasses email confirmation)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name },
    });

    if (authError) {
      console.log(`⚠️  Erro ao criar ${u.email}: ${authError.message}`);
      continue;
    }

    // The trigger auto-creates the profile, but we need to set the role
    if (u.role === "admin" && authUser.user) {
      await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", authUser.user.id);
      console.log(`✅ ${u.email} criado como ADMIN`);
    } else {
      console.log(`✅ ${u.email} criado como CUSTOMER`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ADDRESSES (for seed users)
  // ═══════════════════════════════════════════════════════════════════════
  const { data: adminProfile } = await supabase.from("profiles").select("id").eq("email", "admin@mycommerce.com").single();
  const { data: clientProfile } = await supabase.from("profiles").select("id").eq("email", "cliente@mycommerce.com").single();

  if (adminProfile || clientProfile) {
    const { count: addrCount } = await supabase.from("addresses").select("*", { count: "exact", head: true });
    if (!addrCount) {
      console.log("🏠 Criando endereços...");
      const addrs = [];
      if (adminProfile) {
        addrs.push(
          { user_id: adminProfile.id, street: "Rua das Flores", number: "123", complement: "Apto 456", neighborhood: "Centro", city: "São Paulo", state: "SP", zip_code: "01000-000" },
          { user_id: adminProfile.id, street: "Av. Brasil", number: "1000", neighborhood: "Jardins", city: "São Paulo", state: "SP", zip_code: "01430-000" }
        );
      }
      if (clientProfile) {
        addrs.push(
          { user_id: clientProfile.id, street: "Av. Paulista", number: "456", complement: "Sala 789", neighborhood: "Bela Vista", city: "São Paulo", state: "SP", zip_code: "01310-100" }
        );
      }
      await supabase.from("addresses").insert(addrs);
      console.log(`✅ ${addrs.length} endereços criados!`);
    } else {
      console.log("🏠 Endereços já existem, pulando...");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════════════════════
  const { count: catCount } = await supabase.from("categories").select("*", { count: "exact", head: true });
  if (!catCount) {
    console.log("📂 Criando categorias...");

    const { data: parents } = await supabase.from("categories").insert([
      { name: "Notebooks", description: "Computadores portáteis de alto desempenho" },
      { name: "Monitores", description: "Telas de alta definição para jogos e trabalho" },
      { name: "Periféricos", description: "Acessórios como teclados, mouses e controles" },
      { name: "Headsets", description: "Fones de ouvido com microfone para imersão total" },
    ]).select();

    const perifericos = parents?.find((c) => c.name === "Periféricos");
    if (perifericos) {
      await supabase.from("categories").insert([
        { name: "Teclados", description: "Teclados mecânicos e de membrana", parent_id: perifericos.id },
        { name: "Mouses", description: "Mouses gamer e ergonômicos", parent_id: perifericos.id },
      ]);
    }

    console.log("✅ 6 categorias criadas!");
  } else {
    console.log("📂 Categorias já existem, pulando...");
  }

  // Get all categories for reference
  const { data: categorias } = await supabase.from("categories").select();
  const findCat = (name: string) => categorias?.find((c) => c.name === name);

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════
  const { count: prodCount } = await supabase.from("products").select("*", { count: "exact", head: true });
  if (!prodCount) {
    console.log("🛒 Criando produtos...");

    const { data: products } = await supabase.from("products").insert([
      {
        name: "Notebook Gamer X15",
        slug: "notebook-gamer-x15",
        description: "Intel i9, RTX 4070, 32GB RAM, SSD 1TB. O notebook definitivo para gamers e profissionais criativos.",
        price: 12999.90,
        stock: 10,
        low_stock_threshold: 3,
        weight: 2.5,
        width: 36,
        height: 2.5,
        length: 25,
        image_url: "https://picsum.photos/600/800?random=1",
        category_id: findCat("Notebooks")?.id,
      },
      {
        name: "Monitor UltraWide 34\"",
        slug: "monitor-ultrawide-34",
        description: "Curvo, 144Hz, 1ms, HDR10. Imersão total em jogos e produtividade.",
        price: 3799.90,
        stock: 15,
        low_stock_threshold: 5,
        weight: 8.2,
        width: 82,
        height: 45,
        length: 22,
        image_url: "https://picsum.photos/600/800?random=2",
        category_id: findCat("Monitores")?.id,
      },
      {
        name: "Teclado Mecânico RGB",
        slug: "teclado-mecanico-rgb",
        description: "Switches Red, Keycaps PBT, layout ABNT2. Resposta rápida e conforto para longas sessões.",
        price: 499.90,
        stock: 50,
        low_stock_threshold: 10,
        weight: 0.9,
        width: 44,
        height: 3.5,
        length: 14,
        image_url: "https://picsum.photos/600/800?random=3",
        category_id: findCat("Periféricos")?.id,
      },
      {
        name: "Mouse Gamer 16000 DPI",
        slug: "mouse-gamer-16000-dpi",
        description: "Sensor óptico, 8 botões programáveis, peso ajustável. Precisão cirúrgica.",
        price: 299.90,
        stock: 40,
        low_stock_threshold: 10,
        weight: 0.12,
        width: 7,
        height: 4,
        length: 13,
        image_url: "https://picsum.photos/600/800?random=4",
        category_id: findCat("Periféricos")?.id,
      },
      {
        name: "Headset Surround 7.1",
        slug: "headset-surround-7-1",
        description: "Almofadas em couro, microfone destacável, RGB. Som envolvente para competições.",
        price: 699.90,
        stock: 30,
        low_stock_threshold: 5,
        weight: 0.35,
        image_url: "https://picsum.photos/600/800?random=5",
        category_id: findCat("Headsets")?.id,
      },
    ]).select();

    console.log(`✅ ${products?.length ?? 0} produtos criados!`);
  } else {
    console.log("🛒 Produtos já existem, pulando...");
  }

  // Get all products for reference
  const { data: produtos } = await supabase.from("products").select();
  const findProd = (name: string) => produtos?.find((p) => p.name === name);

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCT IMAGES
  // ═══════════════════════════════════════════════════════════════════════
  const { count: imgCount } = await supabase.from("product_images").select("*", { count: "exact", head: true });
  if (!imgCount) {
    console.log("🖼️  Criando imagens de produto...");

    const { data: images } = await supabase.from("product_images").insert([
      { product_id: findProd("Notebook Gamer X15")?.id, url: "https://picsum.photos/600/800?random=10", position: 0 },
      { product_id: findProd("Notebook Gamer X15")?.id, url: "https://picsum.photos/600/800?random=11", position: 1 },
      { product_id: findProd("Notebook Gamer X15")?.id, url: "https://picsum.photos/600/800?random=12", position: 2 },
      { product_id: findProd("Teclado Mecânico RGB")?.id, url: "https://picsum.photos/600/800?random=13", position: 0 },
      { product_id: findProd("Teclado Mecânico RGB")?.id, url: "https://picsum.photos/600/800?random=14", position: 1 },
      { product_id: findProd("Mouse Gamer 16000 DPI")?.id, url: "https://picsum.photos/600/800?random=15", position: 0 },
      { product_id: findProd("Mouse Gamer 16000 DPI")?.id, url: "https://picsum.photos/600/800?random=16", position: 1 },
      { product_id: findProd("Headset Surround 7.1")?.id, url: "https://picsum.photos/600/800?random=17", position: 0 },
      { product_id: findProd("Headset Surround 7.1")?.id, url: "https://picsum.photos/600/800?random=18", position: 1 },
      { product_id: findProd("Monitor UltraWide 34\"")?.id, url: "https://picsum.photos/600/800?random=19", position: 0 },
    ]).select();

    console.log(`✅ ${images?.length ?? 0} imagens criadas!`);
  } else {
    console.log("🖼️  Imagens já existem, pulando...");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCT VARIANTS
  // ═══════════════════════════════════════════════════════════════════════
  const { count: varCount } = await supabase.from("product_variants").select("*", { count: "exact", head: true });
  if (!varCount) {
    console.log("🎨 Criando variações de produto...");

    const teclado = findProd("Teclado Mecânico RGB");
    const mouse = findProd("Mouse Gamer 16000 DPI");
    const headset = findProd("Headset Surround 7.1");

    const { data: variants } = await supabase.from("product_variants").insert([
      { product_id: teclado?.id, color: "Preto", sku: "TEC-MEC-BLK", stock: 20, price_delta: 0 },
      { product_id: teclado?.id, color: "Branco", sku: "TEC-MEC-WHT", stock: 15, price_delta: 30 },
      { product_id: teclado?.id, color: "Rosa", sku: "TEC-MEC-PNK", stock: 10, price_delta: 50 },
      { product_id: mouse?.id, color: "Preto", sku: "MOU-GAM-BLK", stock: 25, price_delta: 0 },
      { product_id: mouse?.id, color: "Branco", sku: "MOU-GAM-WHT", stock: 15, price_delta: 20 },
      { product_id: headset?.id, size: "P", sku: "HEAD-71-P", stock: 10, price_delta: 0 },
      { product_id: headset?.id, size: "M", sku: "HEAD-71-M", stock: 15, price_delta: 0 },
      { product_id: headset?.id, size: "G", sku: "HEAD-71-G", stock: 10, price_delta: 30 },
    ]).select();

    console.log(`✅ ${variants?.length ?? 0} variações criadas!`);
  } else {
    console.log("🎨 Variações já existem, pulando...");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COUPONS
  // ═══════════════════════════════════════════════════════════════════════
  const { count: coupCount } = await supabase.from("coupons").select("*", { count: "exact", head: true });
  if (!coupCount) {
    console.log("🎟️  Criando cupons...");

    const { data: coupons } = await supabase.from("coupons").insert([
      {
        code: "BEMVINDO10",
        type: "percent",
        value: 10,
        is_active: true,
        max_uses: 100,
        uses_count: 0,
      },
      {
        code: "FRETE50",
        type: "fixed",
        value: 50,
        is_active: true,
        min_order_value: 200,
        max_uses: 50,
        uses_count: 0,
      },
      {
        code: "NATAL25",
        type: "percent",
        value: 25,
        is_active: true,
        min_order_value: 500,
        expires_at: "2026-12-31T23:59:59Z",
        uses_count: 0,
      },
      {
        code: "EXPIRADO5",
        type: "fixed",
        value: 5,
        is_active: false,
        expires_at: "2025-01-01T00:00:00Z",
        uses_count: 3,
        max_uses: 3,
      },
    ]).select();

    console.log(`✅ ${coupons?.length ?? 0} cupons criados!`);
  } else {
    console.log("🎟️  Cupons já existem, pulando...");
  }

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n🎉 Seed finalizado com sucesso!");
  console.log("📊 Resumo: StoreConfig, 6 categorias, 5 produtos, 10 imagens,");
  console.log("   8 variantes, 4 cupons");
  console.log("\n💡 Usuários, endereços, pedidos e reviews serão criados");
  console.log("   automaticamente quando os usuários se cadastrarem via Supabase Auth.");
}

seed().catch((err) => {
  console.error("❌ Erro ao executar seed:", err);
  process.exit(1);
});
