'use client'

import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CalendarRange, PackageSearch, ShoppingCart, TrendingUp, Users } from "lucide-react"

import ProtectedRoute from "@/components/protected-route"

const revenueSeries = Array.from({ length: 30 }).map((_, index) => ({
  date: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }),
  revenue: 600 + Math.random() * 400,
}))

const topItems = [
  { id: "a1", name: "Nordic Crewneck", sku: "APP-3432", qty: 162, revenue: 12984.4 },
  { id: "b2", name: "Everyday Tote", sku: "BAG-9012", qty: 134, revenue: 10112.5 },
  { id: "c3", name: "Aurora Lamp", sku: "HOME-2231", qty: 118, revenue: 8320.9 },
  { id: "d4", name: "Slate Notebook", sku: "STAT-5541", qty: 102, revenue: 5230.1 },
  { id: "e5", name: "Ceramic Mug", sku: "HOME-1007", qty: 96, revenue: 4188.7 },
]

const lowStock = [
  { name: "Slate Notebook", sku: "STAT-5541", stock: 4, threshold: 12, category: "Stationery" },
  { name: "Wool Scarf", sku: "APP-2210", stock: 7, threshold: 10, category: "Apparel" },
  { name: "Aurora Lamp", sku: "HOME-2231", stock: 9, threshold: 14, category: "Home" },
]

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#8b5cf6", "#ec4899"]

type DashboardSection = "overview" | "inventory"

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview")

  const kpis = useMemo(
    () => [
      {
        title: "Umsatz (30 Tage)",
        value: `€${(revenueSeries.reduce((sum, { revenue }) => sum + revenue, 0) / 1000).toFixed(1)}k`,
        description: "+12,4% zum Vormonat",
        Icon: TrendingUp,
      },
      {
        title: "Verkäufe",
        value: topItems.reduce((sum, item) => sum + item.qty, 0).toString(),
        description: "Bestellungen quer über alle Kanäle",
        Icon: ShoppingCart,
      },
      {
        title: "Top Artikel",
        value: topItems.length.toString(),
        description: "Meistverkaufte Produkte",
        Icon: PackageSearch,
      },
      {
        title: "Neue Kunden",
        value: "146",
        description: "Letzte 30 Tage",
        Icon: Users,
      },
    ],
    []
  )

  const abcMix = topItems.map((item, index) => ({
    name: String.fromCharCode(65 + index),
    revenue: item.revenue,
  }))

  return (
    <ProtectedRoute>
      <main className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Inventauri Dashboard</p>
            <h1 className="dashboard-title">Kennzahlen &amp; Trends</h1>
            <p className="dashboard-subtitle">
              Überblick über Umsatz, Bestseller und Bestandsrisiken der vergangenen 30 Tage.
            </p>
          </div>
          <div className="dashboard-toolbar">
            <button type="button" className="dashboard-button">
              <CalendarRange className="dashboard-button-icon" />
              Letzte 30 Tage
            </button>
            <button type="button" className="dashboard-button is-primary">
              Berichte exportieren
            </button>
          </div>
        </header>

        <section className="dashboard-section">
          <div className="dashboard-stats">
            {kpis.map(({ title, value, description, Icon }) => (
              <article key={title} className="dashboard-card dashboard-stat-card">
                <div className="dashboard-stat-icon">
                  <Icon size={18} />
                </div>
                <div className="dashboard-stat-body">
                  <p className="dashboard-kpi-label">{title}</p>
                  <p className="dashboard-kpi-value">{value}</p>
                </div>
                {description ? <span className="dashboard-kpi-trend">{description}</span> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-tabs">
            <div className="dashboard-segmented">
              <ToggleButton
                label="Übersicht"
                isActive={activeSection === "overview"}
                onClick={() => setActiveSection("overview")}
              />
              <ToggleButton
                label="Bestand"
                isActive={activeSection === "inventory"}
                onClick={() => setActiveSection("inventory")}
              />
            </div>
          </div>

          {activeSection === "overview" ? (
            <div className="dashboard-overview">
              <div className="dashboard-grid">
                <article className="dashboard-card dashboard-chart-card">
                  <div className="dashboard-card-header">
                    <div>
                      <h3 className="dashboard-card-title">Umsatzentwicklung</h3>
                      <p className="dashboard-card-caption">Letzte 30 Tage</p>
                    </div>
                    <span className="dashboard-badge">Live-Daten</span>
                  </div>
                  <div className="dashboard-chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--dashboard-grid)" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted)" }} stroke="var(--dashboard-grid)" />
                        <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} stroke="var(--dashboard-grid)" />
                        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} cursor={{ stroke: "var(--dashboard-grid)" }} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="dashboard-card dashboard-chart-card">
                  <div className="dashboard-card-header">
                    <div>
                      <h3 className="dashboard-card-title">ABC Analyse</h3>
                      <p className="dashboard-card-caption">Top-Seller nach Umsatzanteil</p>
                    </div>
                    <button type="button" className="dashboard-button is-ghost">Details</button>
                  </div>
                  <div className="dashboard-chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={abcMix} dataKey="revenue" cx="50%" cy="50%" outerRadius={90} label>
                          {abcMix.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </div>

              <article className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h3 className="dashboard-card-title">Meistverkaufte Artikel</h3>
                    <p className="dashboard-card-caption">Top 5 Artikel nach Absatzmenge</p>
                  </div>
                  <button type="button" className="dashboard-button is-ghost">Alle anzeigen</button>
                </div>
                <div className="dashboard-table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Artikel</th>
                        <th>Absatz</th>
                        <th>Umsatz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="dashboard-table-product">
                              <span className="dashboard-item-name">{item.name}</span>
                              <span className="dashboard-item-sku">SKU: {item.sku}</span>
                            </div>
                          </td>
                          <td>{item.qty}</td>
                          <td>€{item.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          ) : null}

          {activeSection === "inventory" ? (
            <article className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <h3 className="dashboard-card-title">Niedrige Bestände</h3>
                  <p className="dashboard-card-caption">{lowStock.length} Artikel unter Mindestbestand</p>
                </div>
                <button type="button" className="dashboard-button is-ghost">Warnungen verwalten</button>
              </div>
              <ul className="dashboard-low-stock-list">
                {lowStock.map((item) => {
                  const percentage = Math.min(100, Math.round((item.stock / item.threshold) * 100))

                  return (
                    <li key={item.sku} className="dashboard-low-stock-item">
                      <div className="dashboard-low-stock-meta">
                        <div>
                          <p className="dashboard-item-name">{item.name}</p>
                          <p className="dashboard-item-sku">SKU: {item.sku}</p>
                        </div>
                        <span className="dashboard-pill">{item.category}</span>
                      </div>
                      <div className="dashboard-low-stock-row">
                        <span>Bestand</span>
                        <span className="dashboard-low-stock-figure">
                          {item.stock} / {item.threshold}
                        </span>
                      </div>
                      <div className="dashboard-progress-track">
                        <div className="dashboard-progress-fill" style={{ width: `${percentage}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </article>
          ) : null}
        </section>
      </main>
    </ProtectedRoute>
  )
}

type ToggleButtonProps = {
  label: string
  isActive: boolean
  onClick: () => void
}

function ToggleButton({ label, isActive, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-toggle-button${isActive ? " is-active" : ""}`}
    >
      {label}
    </button>
  )
}
