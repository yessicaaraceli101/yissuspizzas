(function ($) {
  const STATE = {
    restaurants: [],
    cart: null,
    settings: { delivery_fee: 25000 },
  };
  const LS = {
    CART: "rbs_cart",
    ORDERS: "rbs_orders",
    THEME: "rbs_theme",
    ADMIN_AUTH: "rbs_admin_authed",
    MENU_OVERRIDES: "rbs_menu_overrides",
    SETTINGS: "rbs_settings",
  };
  const fmt = new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // ============================================================
  // CONFIGURACIÓN DE FIREBASE
  // ============================================================
  const firebaseConfig = {
    apiKey: "AIzaSyAttBvD83gI770HibucrqDVzMuqLcYONNY",
    authDomain: "gastro-7c5ad.firebaseapp.com",
    projectId: "gastro-7c5ad",
    storageBucket: "gastro-7c5ad.firebasestorage.app",
    messagingSenderId: "990505475007",
    appId: "1:990505475007:web:09a5066610de6c7e81df0a"
  };

  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  console.log("✅ Firebase conectado");

  // ============================================================
  // EMPRESA DE ESTE SITIO
  // ------------------------------------------------------------
  // Como esta página web es pública (no hay login), no hay una
  // "sesión" de la que tomar el empresaId como en el panel admin
  // (dashboard.html, pedidos.html, etc). Por eso el empresaId de
  // ESTE negocio va fijo acá — cada negocio que use este mismo
  // sistema para su propia página web tendrá su propia copia de
  // este archivo con SU empresaId puesto abajo. Es lo que hace que
  // el sitio sea "de" una empresa puntual en el sistema multiempresa.
  //
  // ⚠️ IMPORTANTE: reemplazá "PONE_AQUI_TU_EMPRESA_ID" por el
  // empresaId real de tu negocio, y "PONE_AQUI_TU_SUCURSAL_ID" por
  // el ID de la sucursal cuyo menú querés mostrar en este sitio (si
  // el negocio tiene una sola sucursal, igual hay que ponerlo — el
  // menú se carga por sucursal, no por empresa entera). Para
  // encontrar ambos:
  //   1. Entrá al panel admin (dashboard.html) con tu usuario.
  //   2. Abrí la consola del navegador (F12) y escribí:
  //        JSON.parse(sessionStorage.getItem('user')).empresaId
  //      y después, en otra línea:
  //        sessionStorage.getItem('sucursalId')
  //   3. Copiá cada valor tal cual (sin comillas de más) acá abajo.
  // Sin esto: (a) la consulta a "productos" queda sin filtrar y las
  // reglas de seguridad de Firestore la rechazan por completo — es
  // la causa exacta de "Error al cargar el menú."; y (b) los pedidos
  // hechos desde este sitio no tendrían empresaId, así que no
  // aparecerían en el panel de Pedidos del negocio.
  // ============================================================
  const EMPRESA_ID = "pizzeria-yissus";
  const SUCURSAL_ID = "sapucai";

  const nombreCategoria = {
    "pizza": "Pizzas",
    "noodles": "Pastas",
    "drinks": "Bebidas",
    "desserts": "Postres",
    "hamburguesas": "Hamburguesas",
    "comidas": "Platos",
    "rapida": "Comida Rápida",
    "bebidas": "Bebidas"
  };

  // ============================================================
  // CARGAR PRODUCTOS DESDE FIREBASE
  // ============================================================
  function cargarRestaurantesDesdeFirebase() {
    return new Promise((resolve, reject) => {
      if (!EMPRESA_ID || EMPRESA_ID === "PONE_AQUI_TU_EMPRESA_ID") {
        console.error("❌ Falta configurar EMPRESA_ID en assets/script.js — ver el comentario arriba de esta constante.");
        reject(new Error("EMPRESA_ID sin configurar"));
        return;
      }
      if (!SUCURSAL_ID || SUCURSAL_ID === "PONE_AQUI_TU_SUCURSAL_ID") {
        console.error("❌ Falta configurar SUCURSAL_ID en assets/script.js — ver el comentario arriba de esta constante.");
        reject(new Error("SUCURSAL_ID sin configurar"));
        return;
      }
      db.collection('productos')
        .where('empresaId', '==', EMPRESA_ID)
        .where('sucursalId', '==', SUCURSAL_ID)
        .onSnapshot((snapshot) => {
        const productos = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const id = parseInt(doc.id.replace(/\D/g, '')) || Math.floor(Math.random() * 10000);
          productos.push({
            id: id,
            name: data.name || "Sin nombre",
            cuisine: nombreCategoria[data.category] || data.category || "Sin categoría",
            city: "N/A",
            rating: 4.0,
            price: "Gs",
            image: data.image || "https://via.placeholder.com/600x400?text=Sin+imagen",
            description: data.note || "Delicioso plato preparado con los mejores ingredientes.",
            menu: [
              { id: "m1-" + doc.id, name: data.name + " (Individual)", price: Math.round((data.price || 0) * 7300) },
              { id: "m2-" + doc.id, name: data.name + " (Familiar)", price: Math.round((data.price || 0) * 7300 * 1.8) }
            ]
          });
        });
        STATE.restaurants = productos;
        resolve(productos);
      }, (error) => {
        console.error("❌ Error al cargar desde Firebase:", error);
        reject(error);
      });
    });
  }

  // ============================================================
  // FUNCIONES EXISTENTES
  // ============================================================
  function initTheme() {
    const saved = localStorage.getItem(LS.THEME) || "light";
    if (saved === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    $("#themeToggle").on("click", () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "light" : "dark"
      );
      localStorage.setItem(LS.THEME, isDark ? "light" : "dark");
    });
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(LS.SETTINGS) || "null");
      if (s) {
        STATE.settings.delivery_fee =
          Number(s.delivery_fee) || STATE.settings.delivery_fee;
      }
    } catch (e) {}
  }

  function readCart() {
    try {
      STATE.cart = JSON.parse(localStorage.getItem(LS.CART) || "null");
    } catch (e) {
      STATE.cart = null;
    }
    if (!STATE.cart)
      STATE.cart = {
        restaurantId: null,
        items: [],
        booking: { date: "", time: "", party: 1 },
      };
  }

  function saveCart() {
    localStorage.setItem(LS.CART, JSON.stringify(STATE.cart));
  }

  function clearCart() {
    STATE.cart = {
      restaurantId: null,
      items: [],
      booking: { date: "", time: "", party: 1 },
    };
    saveCart();
  }

  function addItem(restaurantId, item) {
    if (STATE.cart.restaurantId && STATE.cart.restaurantId !== restaurantId) {
      if (
        !confirm(
          "Your cart contains items from another restaurant. Clear cart?"
        )
      )
        return;
      clearCart();
    }
    STATE.cart.restaurantId = restaurantId;
    const existing = STATE.cart.items.find((i) => i.id === item.id);
    if (existing) existing.qty += 1;
    else STATE.cart.items.push({ ...item, qty: 1 });
    saveCart();
    renderCartSummary();
  }

  function setBooking({ date, time, party }) {
    STATE.cart.booking = { date, time, party: Number(party) || 1 };
    saveCart();
  }

  // ============================================================
  // cartTotals ahora recibe el tipo de entrega y SOLO cobra
  // el delivery cuando corresponde ("delivery"), nunca en "pickup".
  // ============================================================
  function cartTotals(deliveryType) {
    const subtotal = STATE.cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    const delivery =
      deliveryType === "pickup" ? 0 : Number(STATE.settings.delivery_fee || 0);
    const total = subtotal + delivery;
    return { subtotal, delivery, total };
  }

  function param(name) {
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }

  function restaurantById(id) {
    return STATE.restaurants.find((r) => r.id === Number(id));
  }

  function renderStars(rating) {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  // ============================================================
  // PÁGINA DE INICIO
  // ============================================================
  function pageIndex() {
    cargarRestaurantesDesdeFirebase().then((list) => {
      const cuisines = [...new Set(list.map((r) => r.cuisine))].sort();
      // ANTES: este segundo selector filtraba por "ciudad", un dato que
      // no existe para platos de un menú (siempre quedaba en "N/A").
      // AHORA filtra por sabor puntual — el nombre de cada plato.
      const flavors = [...new Set(list.map((r) => r.name))].sort();
      $("#cuisineFilter").empty().append('<option value="">Todas las categorías</option>');
      cuisines.forEach((c) =>
        $("#cuisineFilter").append(`<option>${c}</option>`)
      );
      $("#cityFilter").empty().append('<option value="">Todos los sabores</option>');
      flavors.forEach((f) => $("#cityFilter").append(`<option>${f}</option>`));

      function render() {
        const q = ($("#q").val() || "").toLowerCase().trim();
        const c = $("#cuisineFilter").val() || "";
        const flavor = $("#cityFilter").val() || "";
        const filtered = list.filter((r) => {
          const matchQ =
            !q ||
            r.name.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q);
          const matchC = !c || r.cuisine === c;
          const matchFlavor = !flavor || r.name === flavor;
          return matchQ && matchC && matchFlavor;
        });
        const $res = $("#results").empty();
        if (!filtered.length) {
          $("#noResults").show();
          return;
        } else {
          $("#noResults").hide();
        }
        filtered.forEach((r) => {
          $res.append(
            ` <article class="card"> <img src="${r.image}" alt="${
              r.name
            }" class="rest-img" loading="lazy"/> <h3>${
              r.name
            }</h3> <div class="badges"> <span class="badge">${
              r.cuisine
            }</span> <span class="badge">${
              r.city
            }</span> <span class="badge stars" title="${
              r.rating
            }">${renderStars(r.rating)}</span> <span class="badge">${
              r.price
            }</span> </div> <p class="muted">${
              r.description
            }</p> <div class="row"> <a class="btn" href="restaurant.html?id=${
              r.id
            }">Ver</a> <a class="btn ghost" href="checkout.html">Realizar pedido</a> </div> </article> `
          );
        });
      }
      $("#searchBtn").on("click", render);
      $("#q,#cuisineFilter,#cityFilter").on("change keyup", (e) => {
        if (e.type === "keyup" && e.key !== "Enter") return;
        render();
      });
      render();
    }).catch(() => {
      $("#results").html('<p class="muted">Error al cargar el menú.</p>');
    });
  }

  // ============================================================
  // PÁGINA DEL RESTAURANTE (DETALLE)
  // ============================================================
  function pageRestaurant() {
    const id = param("id");
    if (!id) {
      location.href = "404.html";
      return;
    }

    cargarRestaurantesDesdeFirebase().then((list) => {
      const r = restaurantById(id);
      if (!r) {
        $("#restaurantDetail").html('<p class="muted">Producto no encontrado.</p>');
        return;
      }

      const overrides = JSON.parse(
        localStorage.getItem(LS.MENU_OVERRIDES) || "{}"
      );
      if (overrides[r.id]) r.menu = overrides[r.id];

      const $wrap = $("#restaurantDetail").empty();

      let menuHTML = '';
      r.menu.forEach((item) => {
        menuHTML += `
          <div class="menu-item">
            <div>${item.name}</div>
            <div class="price">${fmt.format(item.price)}</div>
            <div class="qty">
              <button class="btn ghost addItem" data-id="${item.id}">＋</button>
            </div>
          </div>
        `;
      });

      $wrap.append(`
        <img class="cover" src="${r.image}" alt="${r.name}" onerror="this.src='https://via.placeholder.com/600x400?text=Sin+imagen'" />
        <div class="row between align-center">
          <div>
            <h2>${r.name}</h2>
            <div class="badges">
              <span class="badge">${r.cuisine}</span>
              <span class="badge">${r.city}</span>
              <span class="badge stars">${renderStars(r.rating)}</span>
              <span class="badge">${r.price}</span>
            </div>
          </div>
          <a class="btn" href="checkout.html">Ir al pago</a>
        </div>
        <div class="grid two">
          <section class="card">
            <h3>Menu</h3>
            <div class="menu-list">${menuHTML}</div>
          </section>
          <aside class="card">
            <h3>Reserva</h3>
            <form id="bookingForm" class="stack">
              <label>Fecha<input type="date" name="date" required /></label>
              <div class="field two">
                <label>Hora<input type="time" name="time" required /></label>
                <label>Cantidad de personas<input type="number" name="party" min="1" value="2" required /></label>
              </div>
              <button class="btn" type="submit">Guardar reserva</button>
            </form>
            <div class="card stack" style="margin-top:.75rem">
              <h4>Carrito</h4>
              <div id="miniCart"></div>
              <a class="btn" href="checkout.html">Finalizar compra</a>
            </div>
          </aside>
        </div>
      `);

      $(".addItem").on("click", function () {
        const itemId = $(this).data("id");
        const item = r.menu.find((m) => m.id === itemId);
        addItem(r.id, item);
        renderMiniCart();
      });

      function renderMiniCart() {
        readCart();
        const $mini = $("#miniCart").empty();
        if (!STATE.cart.items.length) {
          $mini.html('<p class="muted">Aún no has agregado productos al carrito</p>');
          return;
        }
        STATE.cart.items.forEach((i) => {
          $mini.append(
            `<div class="row between"><span>${i.name} × ${i.qty}</span><span>${fmt.format(i.price * i.qty)}</span></div>`
          );
        });
      }
      renderMiniCart();

      $("#bookingForm").on("submit", function (e) {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(this).entries());
        setBooking(form);
        alert("Datos de la reserva guardados en el carrito.");
      });
    }).catch(() => {
      $("#restaurantDetail").html('<p class="muted">Error al cargar el producto.</p>');
    });
  }

  // ============================================================
  // CHECKOUT (CON GUARDADO EN FIREBASE)
  // ============================================================
  function getSelectedDeliveryType() {
    // Lee el <select id="deliveryType"> del formulario de checkout.
    // Si no existe (otra página), asumimos "delivery" por defecto.
    const $sel = $("#deliveryType");
    return $sel.length ? $sel.val() || "delivery" : "delivery";
  }

  function renderCartSummary() {
    if ($("body").data("page") !== "checkout") return;
    const $wrap = $("#cartSummary").empty();
    if (!STATE.cart.items.length) {
      $wrap.html('<p class="muted">Todavía no hay productos.</p>');
      $("#subtotal,#deliveryFee,#total").text(fmt.format(0));
      return;
    }
    STATE.cart.items.forEach((i) => {
      const row = $(`<div class="row between"><div>${i.name} × ${i.qty}</div><div>${fmt.format(i.price * i.qty)}</div></div>`);
      $wrap.append(row);
    });
    const deliveryType = getSelectedDeliveryType();
    const t = cartTotals(deliveryType);
    $("#subtotal").text(fmt.format(t.subtotal));
    $("#deliveryFee").text(fmt.format(t.delivery));
    $("#total").text(fmt.format(t.total));
  }

  function pageCheckout() {
    loadSettings();
    readCart();
    renderCartSummary();

    // Recalcular en vivo cuando el usuario cambia Delivery <-> Retiro.
    // (Esta es ahora la ÚNICA lógica de totales: ya no hay un script
    // duplicado en checkout.html calculándolo por su cuenta.)
    $("#deliveryType").on("change", renderCartSummary);

    $("#checkoutForm").on("submit", function (e) {
      e.preventDefault();
      if (!STATE.cart.items.length) {
        alert("El carrito está vacío.");
        return;
      }

      const form = Object.fromEntries(new FormData(this).entries());
      const deliveryType = form.deliveryType || "delivery";
      const totals = cartTotals(deliveryType);

      // ============================================================
      // CONSTRUIR EL PEDIDO
      // ============================================================
      const order = {
        // ⚠️ Antes esto no llevaba empresaId. Sin él, el pedido ni
        // aparece en el panel de "Pedidos" del negocio (que filtra por
        // empresaId) ni probablemente pasa las reglas de seguridad de
        // Firestore para poder guardarse.
        empresaId: EMPRESA_ID,
        sucursalId: SUCURSAL_ID,
        created_at: new Date().toISOString(),
        restaurantId: STATE.cart.restaurantId,
        items: STATE.cart.items.map(i => ({
          name: i.name,
          price: i.price,
          qty: i.qty || 1
        })),
        booking: STATE.cart.booking,
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city || "",
          address: form.address || "",
          notes: form.notes || "",
        },
        deliveryType: deliveryType,
        charges: {
          subtotal: totals.subtotal,
          delivery: totals.delivery,
          total: totals.total,
        },
        status: "Pending", // Estado inicial
        source: "web" // Para identificar que viene de la web
      };

      // ============================================================
      // GUARDAR EN FIREBASE (colección "pedidos")
      // ============================================================
      db.collection('pedidos').add(order)
        .then((docRef) => {
          console.log("✅ Pedido guardado en Firebase con ID:", docRef.id);

          // También guardar en localStorage para la confirmación
          const orderWithId = { ...order, id: docRef.id };
          const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
          orders.unshift(orderWithId);
          localStorage.setItem(LS.ORDERS, JSON.stringify(orders));

          clearCart();
          location.href = `confirm.html?id=${encodeURIComponent(docRef.id)}`;
        })
        .catch((error) => {
          console.error("❌ Error al guardar pedido en Firebase:", error);
          alert("Error al procesar el pedido. Intenta nuevamente.");
        });
    });
  }

  // ============================================================
  // CONFIRM (leer desde Firebase)
  // ============================================================
  function pageConfirm() {
    const id = param("id");
    if (!id) {
      $("#confirmation").html('<p class="muted">Pedido no encontrado.</p>');
      return;
    }

    // Intentar cargar desde Firebase
    db.collection('pedidos').doc(id).get()
      .then((doc) => {
        if (!doc.exists) {
          // Fallback a localStorage
          const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
          const order = orders.find((o) => o.id === id);
          if (!order) {
            $("#confirmation").html('<p class="muted">Pedido no encontrado.</p>');
            return;
          }
          mostrarConfirmacion(order);
        } else {
          const order = { id: doc.id, ...doc.data() };
          mostrarConfirmacion(order);
        }
      })
      .catch((error) => {
        console.error("❌ Error al cargar pedido:", error);
        // Fallback a localStorage
        const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
        const order = orders.find((o) => o.id === id);
        if (!order) {
          $("#confirmation").html('<p class="muted">Pedido no encontrado.</p>');
          return;
        }
        mostrarConfirmacion(order);
      });
  }

  function mostrarConfirmacion(order) {
    $("#orderId").text(`Pedido ID: ${order.id}`);
    const $sum = $("#orderSummary").empty();
    $sum.append(`<p><strong>${order.customer.name}</strong> • ${order.customer.email}</p>`);

    // Mostrar explícitamente el tipo de entrega elegido, para que
    // no haya lugar a confusión con la línea de cargo "Delivery".
    const tipoLabel = order.deliveryType === "pickup" ? "Retiro en el local" : "Delivery";
    $sum.append(`<p><strong>Tipo de entrega:</strong> ${tipoLabel}</p>`);

    if (order.booking && (order.booking.date || order.booking.time)) {
      $sum.append(`<p>Reserva: ${order.booking.date || ""} ${order.booking.time || ""} • Personas ${order.booking.party || 1}</p>`);
    }
    order.items.forEach((i) =>
      $sum.append(`<div class="row between"><span>${i.name} × ${i.qty}</span><span>${fmt.format(i.price * i.qty)}</span></div>`)
    );
    $sum.append(`<hr/>`);
    if (order.deliveryType !== "pickup") {
      $sum.append(`<div class="row between"><span>Delivery</span><span>${fmt.format(order.charges.delivery)}</span></div>`);
    }
    $sum.append(`<div class="row between bold"><span>Total</span><span>${fmt.format(order.charges.total)}</span></div>`);
  }

  // ============================================================
  // ADMIN (sin cambios)
  // ============================================================
  function requireAdmin() {
    if (localStorage.getItem(LS.ADMIN_AUTH) !== "true") {
      location.href = "login.html";
      return false;
    }
    $("#adminLogout").on("click", () => {
      localStorage.removeItem(LS.ADMIN_AUTH);
      location.href = "login.html";
    });
    return true;
  }

  function pageAdminLogin() {
    $("#adminLoginForm").on("submit", function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this).entries());
      if (data.password === "admin123") {
        localStorage.setItem(LS.ADMIN_AUTH, "true");
        location.href = "dashboard.html";
      } else {
        alert("Credenciales inválidas");
      }
    });
  }

  function pageAdminDashboard() {
    if (!requireAdmin()) return;
    const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
    $("#statOrders").text(orders.length);
    $("#statPending").text(orders.filter((o) => o.status === "Pending").length);
    $("#statDelivered").text(orders.filter((o) => o.status === "Delivered").length);
    const $table = $("<table><thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody></tbody></table>");
    orders.slice(0, 10).forEach((o) => {
      $table.find("tbody").append(`<tr><td>${o.id}</td><td>${o.customer.name}</td><td>${fmt.format(o.charges.total)}</td><td>${o.status}</td></tr>`);
    });
    $("#recentOrders").empty().append($table);
  }

  function pageAdminOrders() {
    if (!requireAdmin()) return;
    const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
    const $table = $("<table><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Ciudad</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody></tbody></table>");
    orders.forEach((o, idx) => {
      const tr = $(`<tr><td>${o.id}</td><td>${new Date(o.created_at).toLocaleString()}</td><td>${o.customer.name}</td><td>${o.customer.city}</td><td>${fmt.format(o.charges.total)}</td><td><select data-idx="${idx}" class="statusSel"><option ${o.status === "Pending" ? "selected" : ""}>Pending</option><option ${o.status === "Preparing" ? "selected" : ""}>Preparing</option><option ${o.status === "Out for delivery" ? "selected" : ""}>Out for delivery</option><option ${o.status === "Delivered" ? "selected" : ""}>Delivered</option><option ${o.status === "Canceled" ? "selected" : ""}>Canceled</option></select></td><td><button class="btn ghost saveRow" data-idx="${idx}">Guardar</button></td></tr>`);
      $table.find("tbody").append(tr);
    });
    $("#ordersTable").empty().append($table);
    $("#ordersTable").on("click", ".saveRow", function () {
      const idx = Number($(this).data("idx"));
      const val = $(`.statusSel[data-idx="${idx}"]`).val();
      const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
      if (orders[idx]) {
        orders[idx].status = val;
        localStorage.setItem(LS.ORDERS, JSON.stringify(orders));
        alert("Guardado");
      }
    });
  }

  function pageAdminMenu() {
    if (!requireAdmin()) return;
    cargarRestaurantesDesdeFirebase().then((list) => {
      const $sel = $("#adminRestaurantSelect").empty();
      list.forEach((r) => $sel.append(`<option value="${r.id}">${r.name}</option>`));
      function render() {
        const id = Number($sel.val());
        const r = list.find((x) => x.id === id);
        if (!r) return;
        const overrides = JSON.parse(localStorage.getItem(LS.MENU_OVERRIDES) || "{}");
        const menu = overrides[id] || r.menu;
        const $table = $("<table><thead><tr><th>Nombre</th><th>Precio</th><th>Eliminar</th></tr></thead><tbody></tbody></table>");
        menu.forEach((m, i) => {
          $table.find("tbody").append(`<tr><td><input data-i="${i}" class="menuName" value="${m.name}"/></td><td><input data-i="${i}" class="menuPrice" type="number" step="1" value="${m.price}"/></td><td><button class="btn ghost rmItem" data-i="${i}">✕</button></td></tr>`);
        });
        $("#adminMenuList").empty().append($table);
        $("#addMenuItem").off("submit").on("submit", function (e) {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(this).entries());
          menu.push({ id: "new" + Date.now(), name: data.name, price: Number(data.price) || 0 });
          render();
          this.reset();
        });
        $("#adminMenuList").off("click").on("click", ".rmItem", function () {
          const i = Number($(this).data("i"));
          menu.splice(i, 1);
          render();
        });
        $("#saveMenu").off("click").on("click", function () {
          $("#adminMenuList .menuName").each(function () {
            const i = Number($(this).data("i"));
            menu[i].name = $(this).val();
          });
          $("#adminMenuList .menuPrice").each(function () {
            const i = Number($(this).data("i"));
            menu[i].price = Number($(this).val()) || 0;
          });
          const store = JSON.parse(localStorage.getItem(LS.MENU_OVERRIDES) || "{}");
          store[id] = menu;
          localStorage.setItem(LS.MENU_OVERRIDES, JSON.stringify(store));
          alert("Menú guardado.");
        });
      }
      $sel.on("change", render);
      render();
    });
  }

  function pageAdminSettings() {
    if (!requireAdmin()) return;
    loadSettings();
    const $f = $("#settingsForm");
    $f.find("[name=delivery_fee]").val(STATE.settings.delivery_fee);
    $f.on("submit", function (e) {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(this).entries());
      localStorage.setItem(LS.SETTINGS, JSON.stringify({ delivery_fee: Number(d.delivery_fee) || 0 }));
      alert("Configuración guardada.");
    });
  }

  function initMobileNav() {
    const $btn = $('#navToggle');
    const $nav = $('.topbar .nav');
    if ($btn.length && $nav.length) {
      $btn.off('click').on('click', function () {
        $nav.toggleClass('open');
        $btn.attr('aria-expanded', $nav.hasClass('open') ? 'true' : 'false');
      });
      $nav.find('a').on('click', () => { if (window.innerWidth < 800) $nav.removeClass('open'); });
    }
  }

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  $(function () {
    initTheme();
    initMobileNav();
    readCart();
    const page = $("body").data("page");
    if (page === "index") pageIndex();
    if (page === "restaurant") pageRestaurant();
    if (page === "checkout") pageCheckout();
    if (page === "confirm") pageConfirm();
    if (page === "admin-login") pageAdminLogin();
    if (page === "admin-dashboard") pageAdminDashboard();
    if (page === "admin-orders") pageAdminOrders();
    if (page === "admin-menu") pageAdminMenu();
    if (page === "admin-settings") pageAdminSettings();
  });
})(jQuery);