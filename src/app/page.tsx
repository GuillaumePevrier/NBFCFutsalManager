/**
 * This is a test comment.
 */
                             <CardTitle className="truncate text-lg pr-8">
                                 Match vs <span className="text-primary">{match.details.opponent}</span>
                             </CardTitle>
                             <CardDescription>
                                 {format(new Date(match.details.date), "EEEE d MMMM yyyy", { locale: fr })} à {match.details.time}
                             </CardDescription>
                        </CardHeader>
                       <CardContent className="flex flex-col justify-between flex-grow">
                          <p className="text-sm text-muted-foreground mb-4 truncate">{match.details.location}</p>
                          <MiniScoreboard scoreboard={match.scoreboard} opponentName={match.details.opponent} />
                       </CardContent>
                        <div className="p-4 pt-0 mt-auto">
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <Link href={`/match/${match.id}`} className="flex items-center justify-center">
                              Accéder au match <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        {role === 'coach' && (
