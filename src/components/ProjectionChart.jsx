import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

export default function ProjectionChart({ lecturas, silo }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !lecturas || lecturas.length === 0) return

    const alturaUtil = silo.altura_cono_m + silo.altura_cilindro_m
    const radio = silo.diametro_m / 2
    const conoVol = (1 / 3) * Math.PI * radio ** 2 * silo.altura_cono_m
    const cilindroVol = Math.PI * radio ** 2 * silo.altura_cilindro_m
    const totalVol = conoVol + cilindroVol

    const ordenadas = [...lecturas].sort((a, b) => new Date(a.medido_en) - new Date(b.medido_en))

    const puntos = ordenadas.map((l) => {
      let zonaCiega = silo.altura_zona_ciega_cm
      let distancia = l.distancia_cm < zonaCiega ? zonaCiega : l.distancia_cm
      let alturaAlimento = Math.max(0, Math.min(alturaUtil, alturaUtil - distancia / 100))
      let vol
      if (alturaAlimento <= silo.altura_cono_m) {
        vol = conoVol * (alturaAlimento / silo.altura_cono_m) ** 3
      } else {
        const hCil = alturaAlimento - silo.altura_cono_m
        vol = conoVol + cilindroVol * (hCil / silo.altura_cilindro_m)
      }
      return { fecha: new Date(l.medido_en), porcentaje: (vol / totalVol) * 100 }
    })

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: puntos.map((p) => p.fecha.toLocaleDateString()),
        datasets: [
          {
            label: "nivel (%)",
            data: puntos.map((p) => p.porcentaje.toFixed(1)),
            borderColor: "#14315c",
            backgroundColor: "#14315c",
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } },
        plugins: { legend: { display: false } },
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
