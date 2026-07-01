import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

function calcularPorcentaje(distancia_cm, silo) {
  const alturaUtil = silo.altura_cono_m + silo.altura_cilindro_m
  const radio = silo.diametro_m / 2
  const conoVol = (1 / 3) * Math.PI * radio ** 2 * silo.altura_cono_m
  const cilindroVol = Math.PI * radio ** 2 * silo.altura_cilindro_m
  const totalVol = conoVol + cilindroVol
  const zonaCiega = silo.altura_zona_ciega_cm
  const distancia = distancia_cm < zonaCiega ? zonaCiega : distancia_cm
  const alturaAlimento = Math.max(0, Math.min(alturaUtil, alturaUtil - distancia / 100))
  let vol
  if (alturaAlimento <= silo.altura_cono_m) {
    vol = conoVol * (alturaAlimento / silo.altura_cono_m) ** 3
  } else {
    const hCil = alturaAlimento - silo.altura_cono_m
    vol = conoVol + cilindroVol * (hCil / silo.altura_cilindro_m)
  }
  return (vol / totalVol) * 100
}

function agruparPorDia(lecturas, silo) {
  const porDia = {}
  for (const l of lecturas) {
    const fecha = new Date(l.medido_en)
    const clave = fecha.toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit" })
    if (!porDia[clave]) porDia[clave] = []
    porDia[clave].push(calcularPorcentaje(l.distancia_cm, silo))
  }
  return Object.entries(porDia).map(([fecha, valores]) => ({
    fecha,
    porcentaje: valores.reduce((a, b) => a + b, 0) / valores.length,
  }))
}

export default function ProjectionChart({ lecturas, silo }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !lecturas || lecturas.length === 0) return

    const ordenadas = [...lecturas].sort((a, b) => new Date(a.medido_en) - new Date(b.medido_en))
    const puntos = agruparPorDia(ordenadas, silo)

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: puntos.map((p) => p.fecha),
        datasets: [
          {
            label: "nivel (%)",
            data: puntos.map((p) => p.porcentaje.toFixed(1)),
            borderColor: "#14315c",
            backgroundColor: "rgba(20,49,92,0.08)",
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: "#14315c",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: (v) => `${v}%` },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          x: { grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${Number(ctx.raw).toFixed(1)}% de capacidad`,
            },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [lecturas, silo])

  if (!lecturas || lecturas.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Todavía no hay lecturas para graficar.</p>
  }

  return (
    <div className="relative h-64">
      <canvas ref={canvasRef} />
    </div>
  )
}
