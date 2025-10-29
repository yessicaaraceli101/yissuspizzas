(function ($) {
  const STATE = {
    restaurants: [],
    cart: null,
    settings: { delivery_fee: 3.5, tax_rate: 5.0 },
  };
  const LS = {
    CART: "rbs_cart",
    ORDERS: "rbs_orders",
    THEME: "rbs_theme",
    ADMIN_AUTH: "rbs_admin_authed",
    MENU_OVERRIDES: "rbs_menu_overrides",
    SETTINGS: "rbs_settings",
  };
  const fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  });
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
  const embeddedData = [
    {
      id: 1,
      name: "Sunset Bistro",
      cuisine: "American",
      city: "Vancouver",
      rating: 4.6,
      price: "$$",
      image: "https://picsum.photos/seed/sunset/600/400",
      description: "Cozy neighborhood bistro with seasonal plates.",
      menu: [
        { id: "sb1", name: "Smash Burger", price: 12.5 },
        { id: "sb2", name: "Caesar Salad", price: 9.0 },
        { id: "sb3", name: "Fries", price: 4.5 },
      ],
    },
    {
      id: 2,
      name: "Saffron Garden",
      cuisine: "Indian",
      city: "Seattle",
      rating: 4.7,
      price: "$$",
      image: "https://picsum.photos/seed/saffron/600/400",
      description: "Classic curries and tandoor specials.",
      menu: [
        { id: "sg1", name: "Butter Chicken", price: 14.5 },
        { id: "sg2", name: "Palak Paneer", price: 12.0 },
        { id: "sg3", name: "Garlic Naan", price: 3.5 },
      ],
    },
  ];
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(LS.SETTINGS) || "null");
      if (s) {
        STATE.settings.delivery_fee =
          Number(s.delivery_fee) || STATE.settings.delivery_fee;
        STATE.settings.tax_rate = Number(s.tax_rate) || STATE.settings.tax_rate;
      }
    } catch (e) {}
  }
  function loadRestaurants() {
    return $.getJSON("data/restaurants.json")
      .then((data) => {
        STATE.restaurants = data;
        return data;
      })
      .catch((err) => {
        console.warn(
          "Falling back to embedded data. Run a local server to enable AJAX from file://",
          err
        );
        STATE.restaurants = embeddedData;
        return embeddedData;
      });
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
  function cartTotals() {
    const subtotal = STATE.cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    const delivery = Number(STATE.settings.delivery_fee || 0);
    const tax =
      (subtotal + delivery) * (Number(STATE.settings.tax_rate || 0) / 100);
    const total = subtotal + delivery + tax;
    return { subtotal, delivery, tax, total };
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
  function pageIndex() {
    loadRestaurants().then((list) => {
      const cuisines = [...new Set(list.map((r) => r.cuisine))].sort();
      const cities = [...new Set(list.map((r) => r.city))].sort();
      cuisines.forEach((c) =>
        $("#cuisineFilter").append(`<option>${c}</option>`)
      );
      cities.forEach((c) => $("#cityFilter").append(`<option>${c}</option>`));
      function render() {
        const q = ($("#q").val() || "").toLowerCase().trim();
        const c = $("#cuisineFilter").val() || "";
        const city = $("#cityFilter").val() || "";
        const filtered = list.filter((r) => {
          const matchQ =
            !q ||
            r.name.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q);
          const matchC = !c || r.cuisine === c;
          const matchCity = !city || r.city === city;
          return matchQ && matchC && matchCity;
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
            }">View</a> <a class="btn ghost" href="checkout.html">Checkout</a> </div> </article> `
          );
        });
      }
      $("#searchBtn").on("click", render);
      $("#q,#cuisineFilter,#cityFilter").on("change keyup", (e) => {
        if (e.type === "keyup" && e.key !== "Enter") return;
        render();
      });
      render();
    });
  }
  function pageRestaurant() {
    const id = param("id");
    if (!id) {
      location.href = "404.html";
      return;
    }
    loadRestaurants().then((list) => {
      const r = restaurantById(id);
      if (!r) {
        location.href = "404.html";
        return;
      }
      const overrides = JSON.parse(
        localStorage.getItem(LS.MENU_OVERRIDES) || "{}"
      );
      if (overrides[r.id]) r.menu = overrides[r.id];
      const $wrap = $("#restaurantDetail").empty();
      $wrap.append(
        ` <img class="cover" src="${r.image}" alt="${
          r.name
        }" /> <div class="row between align-center"> <div> <h2>${
          r.name
        }</h2> <div class="badges"> <span class="badge">${
          r.cuisine
        }</span> <span class="badge">${
          r.city
        }</span> <span class="badge stars">${renderStars(
          r.rating
        )}</span> <span class="badge">${
          r.price
        }</span> </div> </div> <a class="btn" href="checkout.html">Go to checkout</a> </div> <div class="grid two"> <section class="card"> <h3>Menu</h3> <div class="menu-list" id="menuList"></div> </section> <aside class="card"> <h3>Booking</h3> <form id="bookingForm" class="stack"> <label>Date <input type="date" name="date" required /> </label> <div class="field two"> <label>Time <input type="time" name="time" required /> </label> <label>Party size <input type="number" name="party" min="1" value="2" required /> </label> </div> <button class="btn" type="submit">Save details</button> </form> <div class="card stack" style="margin-top:.75rem"> <h4>Cart</h4> <div id="miniCart"></div> <a class="btn" href="checkout.html">Proceed to checkout</a> </div> </aside> </div> `
      );
      const $menu = $("#menuList").empty();
      r.menu.forEach((item) => {
        $menu.append(
          ` <div class="menu-item"> <div>${
            item.name
          }</div> <div class="price">${fmt.format(
            item.price
          )}</div> <div class="qty"> <button class="btn ghost addItem" data-id="${
            item.id
          }">＋</button> </div> </div> `
        );
      });
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
          $mini.html('<p class="muted">Your cart is empty</p>');
          return;
        }
        STATE.cart.items.forEach((i) => {
          $mini.append(
            `<div class="row between"><span>${i.name} × ${
              i.qty
            }</span><span>${fmt.format(i.price * i.qty)}</span></div>`
          );
        });
      }
      renderMiniCart();
      $("#bookingForm").on("submit", function (e) {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(this).entries());
        setBooking(form);
        alert("Booking details saved to cart.");
      });
    });
  }
  function renderCartSummary() {
    if ($("body").data("page") !== "checkout") return;
    const $wrap = $("#cartSummary").empty();
    if (!STATE.cart.items.length) {
      $wrap.html(
        '<p class="muted">No items yet. Add items on a restaurant page.</p>'
      );
      $("#subtotal,#deliveryFee,#tax,#total").text(fmt.format(0));
      return;
    }
    STATE.cart.items.forEach((i) => {
      const row = $(
        `<div class="row between"><div>${i.name} × ${
          i.qty
        }</div><div>${fmt.format(i.price * i.qty)}</div></div>`
      );
      $wrap.append(row);
    });
    const t = cartTotals();
    $("#subtotal").text(fmt.format(t.subtotal));
    $("#deliveryFee").text(fmt.format(t.delivery));
    $("#tax").text(fmt.format(t.tax));
    $("#total").text(fmt.format(t.total));
  }
  function pageCheckout() {
    loadSettings();
    readCart();
    renderCartSummary();
    $("#checkoutForm").on("submit", function (e) {
      e.preventDefault();
      if (!STATE.cart.items.length) {
        alert("Your cart is empty.");
        return;
      }
      const form = Object.fromEntries(new FormData(this).entries());
      const orderId =
        "TT" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const totals = cartTotals();
      const order = {
        id: orderId,
        created_at: new Date().toISOString(),
        restaurantId: STATE.cart.restaurantId,
        items: STATE.cart.items,
        booking: STATE.cart.booking,
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          address: form.address,
          notes: form.notes || "",
        },
        charges: {
          subtotal: totals.subtotal,
          delivery: totals.delivery,
          tax: totals.tax,
          total: totals.total,
        },
        status: "Pending",
      };
      const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
      orders.unshift(order);
      localStorage.setItem(LS.ORDERS, JSON.stringify(orders));
      const oid = order.id;
      clearCart();
      location.href = `confirm.html?id=${encodeURIComponent(oid)}`;
    });
  }
  function pageConfirm() {
    const id = param("id");
    const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
    const order = orders.find((o) => o.id === id);
    if (!order) {
      $("#confirmation").html('<p class="muted">Order not found.</p>');
      return;
    }
    $("#orderId").text(`Order ID: ${order.id}`);
    const $sum = $("#orderSummary").empty();
    $sum.append(
      `<p><strong>${order.customer.name}</strong> • ${order.customer.email}</p>`
    );
    if (order.booking && (order.booking.date || order.booking.time)) {
      $sum.append(
        `<p>Booking: ${order.booking.date || ""} ${
          order.booking.time || ""
        } • Party ${order.booking.party || 1}</p>`
      );
    }
    order.items.forEach((i) =>
      $sum.append(
        `<div class="row between"><span>${i.name} × ${
          i.qty
        }</span><span>${fmt.format(i.price * i.qty)}</span></div>`
      )
    );
    $sum.append(`<hr/>`);
    $sum.append(
      `<div class="row between"><span>Delivery</span><span>${fmt.format(
        order.charges.delivery
      )}</span></div>`
    );
    $sum.append(
      `<div class="row between"><span>Tax</span><span>${fmt.format(
        order.charges.tax
      )}</span></div>`
    );
    $sum.append(
      `<div class="row between bold"><span>Total</span><span>${fmt.format(
        order.charges.total
      )}</span></div>`
    );
  }
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
        alert("Invalid credentials");
      }
    });
  }
  function pageAdminDashboard() {
    if (!requireAdmin()) return;
    const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
    $("#statOrders").text(orders.length);
    $("#statPending").text(orders.filter((o) => o.status === "Pending").length);
    $("#statDelivered").text(
      orders.filter((o) => o.status === "Delivered").length
    );
    const $table = $(
      "<table><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody></tbody></table>"
    );
    orders.slice(0, 10).forEach((o) => {
      $table
        .find("tbody")
        .append(
          `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>${fmt.format(
            o.charges.total
          )}</td><td>${o.status}</td></tr>`
        );
    });
    $("#recentOrders").empty().append($table);
  }
  function pageAdminOrders() {
    if (!requireAdmin()) return;
    const orders = JSON.parse(localStorage.getItem(LS.ORDERS) || "[]");
    const $table = $(
      "<table><thead><tr><th>ID</th><th>When</th><th>Customer</th><th>City</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody></tbody></table>"
    );
    orders.forEach((o, idx) => {
      const tr = $(
        `<tr> <td>${o.id}</td> <td>${new Date(
          o.created_at
        ).toLocaleString()}</td> <td>${o.customer.name}</td> <td>${
          o.customer.city
        }</td> <td>${fmt.format(
          o.charges.total
        )}</td> <td><select data-idx="${idx}" class="statusSel"> <option ${
          o.status === "Pending" ? "selected" : ""
        }>Pending</option> <option ${
          o.status === "Preparing" ? "selected" : ""
        }>Preparing</option> <option ${
          o.status === "Out for delivery" ? "selected" : ""
        }>Out for delivery</option> <option ${
          o.status === "Delivered" ? "selected" : ""
        }>Delivered</option> <option ${
          o.status === "Canceled" ? "selected" : ""
        }>Canceled</option> </select></td> <td><button class="btn ghost saveRow" data-idx="${idx}">Save</button></td> </tr>`
      );
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
        alert("Saved");
      }
    });
  }
  function pageAdminMenu() {
    if (!requireAdmin()) return;
    loadRestaurants().then((list) => {
      const $sel = $("#adminRestaurantSelect").empty();
      list.forEach((r) =>
        $sel.append(`<option value="${r.id}">${r.name}</option>`)
      );
      function render() {
        const id = Number($sel.val());
        const r = list.find((x) => x.id === id);
        const overrides = JSON.parse(
          localStorage.getItem(LS.MENU_OVERRIDES) || "{}"
        );
        const menu = overrides[id] || r.menu;
        const $table = $(
          "<table><thead><tr><th>Name</th><th>Price</th><th>Remove</th></tr></thead><tbody></tbody></table>"
        );
        menu.forEach((m, i) => {
          $table
            .find("tbody")
            .append(
              `<tr> <td><input data-i="${i}" class="menuName" value="${m.name}"/></td> <td><input data-i="${i}" class="menuPrice" type="number" step="0.01" value="${m.price}"/></td> <td><button class="btn ghost rmItem" data-i="${i}">✕</button></td> </tr>`
            );
        });
        $("#adminMenuList").empty().append($table);
        $("#addMenuItem")
          .off("submit")
          .on("submit", function (e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(this).entries());
            menu.push({
              id: "new" + Date.now(),
              name: data.name,
              price: Number(data.price) || 0,
            });
            render();
            this.reset();
          });
        $("#adminMenuList")
          .off("click")
          .on("click", ".rmItem", function () {
            const i = Number($(this).data("i"));
            menu.splice(i, 1);
            render();
          });
        $("#saveMenu")
          .off("click")
          .on("click", function () {
            $("#adminMenuList .menuName").each(function () {
              const i = Number($(this).data("i"));
              menu[i].name = $(this).val();
            });
            $("#adminMenuList .menuPrice").each(function () {
              const i = Number($(this).data("i"));
              menu[i].price = Number($(this).val()) || 0;
            });
            const store = JSON.parse(
              localStorage.getItem(LS.MENU_OVERRIDES) || "{}"
            );
            store[id] = menu;
            localStorage.setItem(LS.MENU_OVERRIDES, JSON.stringify(store));
            alert("Menu saved (localStorage).");
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
    $f.find("[name=tax_rate]").val(STATE.settings.tax_rate);
    $f.on("submit", function (e) {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(this).entries());
      const s = {
        delivery_fee: Number(d.delivery_fee) || 0,
        tax_rate: Number(d.tax_rate) || 0,
      };
      localStorage.setItem(LS.SETTINGS, JSON.stringify(s));
      alert("Settings saved.");
    });
  }
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

  // ---- Mobile nav toggle ----
  function initMobileNav(){
    const $btn = $('#navToggle');
    const $nav = $('.topbar .nav');
    if($btn.length && $nav.length){
      $btn.off('click').on('click', function(){
        $nav.toggleClass('open');
        const expanded = $nav.hasClass('open');
        $btn.attr('aria-expanded', expanded ? 'true' : 'false');
      });
      $nav.find('a').on('click', ()=> { if(window.innerWidth < 800) $nav.removeClass('open'); });
    }
  }
