import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000/api";

export default function TopProducts({ year }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const selectedYear = String(year || "2024");

        const datasetMap = {
          "2022": "superstore_2022.csv",
          "2023": "superstore_2023.csv",
          "2024": "superstore_2024.csv",
          "2025": "superstore_2025.csv",
        };

        const dataset =
          datasetMap[selectedYear] ||
          "superstore_2024.csv";

        const url =
          `${API_URL}/top-products` +
          `?dataset=${encodeURIComponent(dataset)}` +
          `&limit=10`;

        console.log("TOP PRODUCTS REQUEST:", url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Top Products API returned ${response.status}`
          );
        }

        const result = await response.json();

        if (cancelled) return;

        const rows = Array.isArray(result)
          ? result
          : result?.data || [];

        const formattedProducts = rows
          .slice(0, 10)
          .map((item, index) => ({
            id:
              Number(item?.rank) ||
              index + 1,

            name:
              item?.product_name ||
              item?.productName ||
              item?.name ||
              "Unknown Product",

            category:
              item?.category ||
              "Other",

            sales:
              Number(item?.sales) || 0,

            profit:
              Number(item?.profit) || 0,

            orders:
              Number(item?.orders) || 0,

            image:
              item?.image ||
              item?.image_url ||
              item?.product_image ||
              "",
          }));

        setProducts(formattedProducts);
      } catch (err) {
        console.error(
          "Top Products error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load top products."
          );

          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [year]);

  function formatCurrency(value) {
    const number = Number(value) || 0;

    if (number >= 10000000) {
      return `₹${(
        number / 10000000
      ).toFixed(2)}Cr`;
    }

    if (number >= 100000) {
      return `₹${(
        number / 100000
      ).toFixed(1)}L`;
    }

    if (number >= 1000) {
      return `₹${(
        number / 1000
      ).toFixed(0)}K`;
    }

    return `₹${number.toLocaleString(
      "en-IN"
    )}`;
  }

  function getCategoryClass(category) {
    const value =
      String(category || "").toLowerCase();

    if (value.includes("technology")) {
      return "category-tech";
    }

    if (value.includes("furniture")) {
      return "category-furniture";
    }

    return "category-other";
  }

  function getProductImage(product) {
    if (product.image) {
      return product.image;
    }

    const name =
      String(product.name || "").toLowerCase();

    if (
      name.includes("laptop") ||
      name.includes("macbook") ||
      name.includes("computer")
    ) {
      return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=100&q=80";
    }

    if (
      name.includes("phone") ||
      name.includes("smartphone") ||
      name.includes("mobile")
    ) {
      return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=100&q=80";
    }

    if (name.includes("camera")) {
      return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=100&q=80";
    }

    if (name.includes("printer")) {
      return "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=100&q=80";
    }

    if (
      name.includes("monitor") ||
      name.includes("display")
    ) {
      return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=100&q=80";
    }

    if (name.includes("tablet")) {
      return "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=100&q=80";
    }

    if (name.includes("chair")) {
      return "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=100&q=80";
    }

    if (
      name.includes("table") ||
      name.includes("desk")
    ) {
      return "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=100&q=80";
    }

    if (
      name.includes("bookshelf") ||
      name.includes("bookcase")
    ) {
      return "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=100&q=80";
    }

    if (
      String(product.category)
        .toLowerCase()
        .includes("furniture")
    ) {
      return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=100&q=80";
    }

    if (
      String(product.category)
        .toLowerCase()
        .includes("technology")
    ) {
      return "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=100&q=80";
    }

    return "";
  }

  const visibleProducts = showAll
    ? products
    : products.slice(0, 5);

  return (
    <div className="chart-card products-card">

      <div className="chart-header">

        <div>
          <h3>
            Top 10 Products
          </h3>

          <p>
            Best performing products for{" "}
            <strong>
              {year || "2024"}
            </strong>
          </p>
        </div>

        {!loading &&
          !error &&
          products.length > 5 && (
            <button
              className="view-all"
              type="button"
              onClick={() =>
                setShowAll(
                  (previous) => !previous
                )
              }
            >
              {showAll
                ? "Show Less"
                : "View All"}
            </button>
          )}

      </div>

      {loading && (
        <div
          style={{
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7890ad",
          }}
        >
          Loading top products...
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        products.length > 0 && (
          <div className="table-wrapper">

            <table className="product-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Sales</th>
                  <th>Profit</th>
                  <th>Orders</th>
                </tr>
              </thead>

              <tbody>

                {visibleProducts.map(
                  (product) => (
                    <tr key={product.id}>

                      <td>
                        {product.id}
                      </td>

                      <td>
                        <div className="product-title">

                          <div
                            className="product-image"
                            style={{
                              width: 32,
                              height: 32,
                              minWidth: 32,
                              borderRadius: 7,
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background:
                                "#26364d",
                            }}
                          >

                            {getProductImage(
                              product
                            ) ? (
                              <img
                                src={getProductImage(
                                  product
                                )}
                                alt={
                                  product.name
                                }
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit:
                                    "cover",
                                  display:
                                    "block",
                                }}
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color:
                                    "#ffffff",
                                }}
                              >
                                {product.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}

                          </div>

                          <span
                            title={
                              product.name
                            }
                          >
                            {product.name}
                          </span>

                        </div>
                      </td>

                      <td>
                        <span
                          className={getCategoryClass(
                            product.category
                          )}
                        >
                          {product.category}
                        </span>
                      </td>

                      <td>
                        {formatCurrency(
                          product.sales
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          product.profit
                        )}
                      </td>

                      <td>
                        {product.orders.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      {!loading &&
        !error &&
        products.length === 0 && (
          <div
            style={{
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7890ad",
            }}
          >
            No product data available.
          </div>
        )}

    </div>
  );
}