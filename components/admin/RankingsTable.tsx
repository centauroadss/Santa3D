'use client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
export default function RankingsTable({ rankings, onExport }: any) {
  const getMedalEmoji = (p: number) => p===1?'🥇':p===2?'🥈':p===3?'🥉':`#${p}`;
  const getPositionColor = (p: number) => p===1?'bg-yellow-500 text-white':p===2?'bg-gray-400 text-white':p===3?'bg-orange-500 text-white':'bg-gray-100 text-gray-700';
  return (
    <Card title="🏆 Rankings" subtitle={`${rankings.length} participantes`} footer={onExport && <Button onClick={onExport} variant="outline" className="w-full">📥 Exportar</Button>}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-bold text-gray-900">Posición</th>
              <th className="text-left py-3 px-4 font-bold text-gray-900">Participante</th>
              <th className="text-left py-3 px-4 font-bold text-gray-900">Instagram</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Edad</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">❤️ Votos</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">FPS</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Puntaje</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Link</th>
            </tr>
          </thead>
          <tbody>
            {(rankings.length === 0) ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Sin datos</td></tr>
            ) : (
              rankings.map((r: any) => (
                <tr key={r.position} className="border-b border-gray-100 hover:bg-gray-50">
                   <td className="py-4 px-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getPositionColor(r.position)}`}>{getMedalEmoji(r.position)}</div></td>
                   <td className="py-4 px-4">
                       <div className="font-bold text-gray-900">{r.participant.alias}</div>
                       <div className="text-sm text-gray-500">{r.participant.nombreCompleto}</div>
                   </td>
                   <td className="py-4 px-4"><a href={`https://instagram.com/${r.participant.instagram.replace('@','')}`} target="_blank" className="text-purple-600 font-bold hover:underline">{r.participant.instagram}</a></td>
                   <td className="py-4 px-4 text-center font-bold text-gray-900">{r.participant.edad}</td>
                   <td className="py-4 px-4 text-center text-pink-600 font-bold">{r.video.instagramLikes || '-'}</td>
                   <td className="py-4 px-4 text-center font-mono text-xs text-gray-900">{r.video.fps || 30} fps</td>
                   <td className="py-4 px-4 text-center"><span className="bg-purple-600 text-white px-3 py-1 rounded-full font-bold">{r.scores.average}</span></td>
                   <td className="py-4 px-4 text-center"><a href={r.video.streamUrl} target="_blank" className="text-blue-600 hover:underline text-sm">Ver Video</a></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
