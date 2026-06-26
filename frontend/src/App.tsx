import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Shield,
  PieChart,
  Users,
  TrendingUp,
} from 'lucide-react';

const panels = [
  {
    id: 1,
    title: 'Request Latency (p50/p95/p99)',
    icon: Activity,
    grafanaPanelId: 1,
  },
  {
    id: 2,
    title: 'Case Type Distribution',
    icon: BarChart3,
    grafanaPanelId: 2,
  },
  {
    id: 3,
    title: 'Safety Gate Interventions',
    icon: Shield,
    grafanaPanelId: 3,
  },
  {
    id: 4,
    title: 'Evidence Verdict',
    icon: PieChart,
    grafanaPanelId: 4,
  },
  {
    id: 5,
    title: 'Human Review Required',
    icon: Users,
    grafanaPanelId: 5,
  },
];

const GRAFANA_BASE = import.meta.env.VITE_GRAFANA_URL || '/grafana';
const DASHBOARD_UID = 'ticket-analyzer';

function App() {
  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="text-blue-400" size={36} />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            IUT_Dhonghorsho
          </span>
          <span className="text-sm font-normal text-white/60 ml-4">
            Live Monitoring Dashboard
          </span>
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Real-time metrics from the Ticket Analyzer API
        </p>
      </motion.header>

      {/* Grid of panels */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {panels.map((panel, index) => {
          const Icon = panel.icon;
          const iframeSrc = `${GRAFANA_BASE}/d-solo/${DASHBOARD_UID}/ticket-analyzer?orgId=1&panelId=${panel.grafanaPanelId}&refresh=5s&theme=dark`;

          return (
            <motion.div
              key={panel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Icon className="text-blue-400" size={20} />
                <h2 className="text-white font-medium text-sm">{panel.title}</h2>
              </div>
              <div className="relative w-full" style={{ height: '280px' }}>
                <iframe
                  src={iframeSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  allowTransparency
                  sandbox="allow-scripts allow-same-origin"
                  loading="lazy"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-8 text-center text-white/30 text-xs">
        Dashboard updates every 5s • Grafana embedded with iframes
      </footer>
    </div>
  );
}

export default App;
