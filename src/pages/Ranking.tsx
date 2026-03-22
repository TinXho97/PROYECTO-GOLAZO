import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Gift, ChevronRight, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { cn } from '../lib/utils';

interface RankingPageProps {
  user: User;
  isDarkMode?: boolean;
}

export default function RankingPage({ user, isDarkMode }: RankingPageProps) {
  const [ranking, setRanking] = useState<{ id: string, name: string, points: number }[]>([]);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    setRanking(dataService.getRanking());
    setUserPoints(dataService.getUserPoints(user.id));
  }, [user.id]);

  const pointsToFreeTurn = 10;
  const progress = Math.min(100, (userPoints % pointsToFreeTurn) * 10);

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">Ranking & Puntos</h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Suma puntos jugando y canjealos por turnos gratis</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Status */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-green-600 border-none shadow-2xl rounded-3xl overflow-hidden text-white">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">Tus Puntos</p>
                  <p className="text-5xl font-black">{userPoints}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Progreso para turno gratis</span>
                  <span>{userPoints % pointsToFreeTurn} / {pointsToFreeTurn}</span>
                </div>
                <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  />
                </div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center pt-2">
                  ¡Te faltan {pointsToFreeTurn - (userPoints % pointsToFreeTurn)} partidos para tu próximo regalo!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
            <CardHeader>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-500" />
                Premios Disponibles
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm">
                    <Trophy className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">Turno Gratis F5</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">10 Puntos</p>
                  </div>
                </div>
                <Badge variant="neutral">Bloqueado</Badge>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm">
                    <Medal className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">Bebida Gratis</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">5 Puntos</p>
                  </div>
                </div>
                <Badge variant="neutral">Bloqueado</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Ranking Semanal
          </h2>
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {ranking.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">
                    <p className="font-bold">Aún no hay jugadores en el ranking</p>
                  </div>
                ) : (
                  ranking.map((player, index) => (
                    <div 
                      key={player.id} 
                      className={cn(
                        "p-6 flex items-center justify-between transition-colors",
                        player.id === user.id ? "bg-green-50/50 dark:bg-green-900/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-black text-lg",
                          index === 0 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          index === 1 ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" :
                          index === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                          "text-zinc-300 dark:text-zinc-700"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
                            <UserIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 dark:text-zinc-100">
                              {player.name}
                              {player.id === user.id && <span className="ml-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase">Tú</span>}
                            </p>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Jugador Estrella</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{player.points}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Puntos</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
