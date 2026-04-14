import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Gift, ChevronRight, User as UserIcon, Info, TrendingUp, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { cn } from '../lib/utils';

interface RankingPageProps {
  user: User;
}

export default function RankingPage({ user }: RankingPageProps) {
  const [ranking, setRanking] = useState<{ id: string, name: string, points: number }[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [lastPoints, setLastPoints] = useState<{ points: number, isPromo: boolean } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const clientId = user.client_id;
      const currentRanking = await dataService.getRanking(clientId);
      setRanking(currentRanking);
      const identifier = user.role === 'client' && user.phone ? user.phone : user.id;
      const points = await dataService.getUserPoints(identifier, clientId);
      setUserPoints(points);
      
      // Calculate last points
      const hasCompleted = await dataService.hasCompletedBookings(identifier, clientId);
      if (hasCompleted) {
        setLastPoints({ points: 1, isPromo: false }); // Points logic simplified to 1 per completed booking
      }
    };
    fetchData();
  }, [user.id, user.phone, user.role, user.client_id]);

  const identifier = user.role === 'client' && user.phone ? user.phone : user.id;
  const userPosition = ranking.findIndex(p => p.id === identifier) + 1;
  const pointsToFreeTurn = 100;
  const progress = Math.min(100, (userPoints % pointsToFreeTurn));

  const prizes = [
    { id: 1, name: 'Bebida Gratis', points: 50, icon: Medal, description: 'Cualquier bebida de 500ml' },
    { id: 2, name: 'Turno Gratis F5', points: 100, icon: Trophy, description: 'Válido para lunes a jueves' },
    { id: 3, name: 'Camiseta Oficial', points: 500, icon: Star, description: 'Edición limitada Golazo' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="relative overflow-hidden p-6 sm:p-8 rounded-3xl sm:rounded-[40px] bg-zinc-900 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="neutral" className="bg-sky-500/20 text-sky-400 border-sky-500/30 px-4 py-1">
              TEMPORADA MARZO 2026
            </Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter">Ranking Mensual</h1>
            <p className="text-zinc-400 font-medium text-base sm:text-lg">
              Sumá puntos reservando y jugá más para ganar premios.
            </p>
          </div>
          {userPosition > 0 && (
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/40">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Tu Posición</p>
                <p className="text-3xl font-black">Estás #{userPosition} <span className="text-sm font-bold text-sky-400">este mes</span></p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Status & Progress */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-sky-600 border-none shadow-2xl rounded-3xl sm:rounded-[40px] overflow-hidden text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Target className="w-24 h-24 sm:w-32 sm:h-32 rotate-12" />
            </div>
            <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">Puntos Acumulados</p>
                  <motion.p 
                    key={userPoints}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl sm:text-5xl lg:text-6xl font-black"
                  >
                    {userPoints}
                  </motion.p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" />
                </div>
              </div>

              {lastPoints && (
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 inline-flex items-center gap-2">
                  <span className="text-xs font-bold">
                    Última reserva: <span className="text-yellow-300">+{lastPoints.points} puntos</span>
                    {lastPoints.isPromo && " 🔥"}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                  <span>Próximo Premio</span>
                  <span>{userPoints % pointsToFreeTurn} / {pointsToFreeTurn}</span>
                </div>
                <div className="h-4 w-full bg-white/20 rounded-full overflow-hidden p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                  />
                </div>
                <p className="text-xs font-bold text-white/80 text-center leading-relaxed">
                  ¡Te faltan <span className="text-yellow-300 font-black">{(pointsToFreeTurn - (userPoints % pointsToFreeTurn)).toFixed(1)} puntos</span> para tu próximo regalo!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl sm:rounded-[40px] overflow-hidden bg-white">
            <CardHeader className="pb-2">
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500" />
                Premios
              </h3>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {prizes.map((prize) => {
                const isUnlocked = userPoints >= prize.points;
                const pointsNeeded = prize.points - userPoints;
                
                return (
                  <motion.div 
                    key={prize.id}
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      "p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group",
                      isUnlocked 
                        ? "bg-emerald-50 border-emerald-100" 
                        : "bg-zinc-50 border-zinc-100 opacity-75"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors",
                        isUnlocked ? "bg-emerald-500 text-white" : "bg-white text-zinc-400"
                      )}>
                        <prize.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-zinc-900">{prize.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{prize.description}</p>
                      </div>
                      <div className="text-right">
                        {isUnlocked ? (
                          <Badge variant="success" className="bg-emerald-500 text-white border-none">Canjear</Badge>
                        ) : (
                          <p className="text-[10px] font-black text-zinc-400 uppercase">Faltan {pointsNeeded.toFixed(1)} pts</p>
                        )}
                      </div>
                    </div>
                    {!isUnlocked && (
                      <div className="mt-3 h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 transition-all" 
                          style={{ width: `${Math.min(100, (userPoints / prize.points) * 100)}%` }} 
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          <div className="bg-zinc-900 p-6 rounded-[32px] text-white space-y-3">
            <div className="flex items-center gap-2 text-sky-400">
              <Info className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">¿Cómo funciona?</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Sumás puntos cada vez que reservás y jugás. Los horarios con menor demanda dan más puntos.
            </p>
          </div>
        </div>

        {/* Ranking List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Tabla de Posiciones
            </h2>
            <Badge variant="neutral" className="font-black">TOP 50</Badge>
          </div>

          <Card className="border-none shadow-xl rounded-3xl sm:rounded-[40px] overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-50">
                {ranking.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">
                    <p className="font-bold">Aún no hay jugadores en el ranking</p>
                  </div>
                ) : (
                  ranking.map((player, index) => {
                    const isTop3 = index < 3;
                    const isUser = player.id === user.id;
                    const nextPlayer = ranking[index - 1];
                    const diff = nextPlayer ? (nextPlayer.points - player.points).toFixed(1) : null;

                    return (
                      <motion.div 
                        key={player.id} 
                        whileHover={{ backgroundColor: "rgba(244, 244, 245, 0.5)" }}
                        className={cn(
                          "p-4 sm:p-6 flex items-center justify-between transition-all relative group",
                          isUser ? "bg-sky-50/80" : ""
                        )}
                      >
                        {isUser && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-500" />}
                        
                        <div className="flex items-center gap-3 sm:gap-6">
                          <div className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-xl shadow-sm",
                            index === 0 ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-white scale-110 shadow-yellow-500/20" :
                            index === 1 ? "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white shadow-zinc-400/20" :
                            index === 2 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/20" :
                            "bg-zinc-50 text-zinc-400"
                          )}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className={cn(
                              "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                              isUser ? "bg-sky-500 text-white" : "bg-zinc-100 text-zinc-400"
                            )}>
                              <UserIcon className="w-5 h-5 sm:w-7 sm:h-7" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <p className={cn("font-black text-sm sm:text-lg truncate max-w-[100px] sm:max-w-none", isUser ? "text-sky-600" : "text-zinc-900")}>
                                  {player.name}
                                </p>
                                {isUser && <Badge variant="neutral" className="bg-sky-500 text-white border-none text-[8px] px-1 sm:px-2">TÚ</Badge>}
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                                <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                  {index === 0 ? "Leyenda" : index < 5 ? "Pro" : "Aficionado"}
                                </p>
                                {diff && diff !== "0.0" && (
                                  <span className="text-[8px] sm:text-[9px] font-black text-sky-500">+{diff} pts</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-xl sm:text-3xl font-black", isTop3 ? "text-zinc-900" : "text-zinc-500")}>
                            {player.points}
                          </p>
                          <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Puntos</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
