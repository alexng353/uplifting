/**
 * FRONT VIEW MUSCLE CHART SVG
 * Defined muscle paths for anatomical visualization
 */

interface Props {
	getColor: (muscleId: string) => string;
}

export function MuscleChartFront({ getColor }: Props) {
	return (
		<svg viewBox="0 0 200 400" className="muscle-chart-svg" role="img">
			<title>Front view muscle chart</title>

			{/* Body silhouette */}
			<path
				d={`
					M100 5
					C118 5 122 18 122 28
					C122 40 114 48 108 52
					L108 58
					C130 62 148 75 155 98
					L165 102 L176 148 L180 195
					L166 200 L152 142 L145 100
					L145 168 L138 198
					L130 360 L126 372 L118 374
					L108 218 L100 222
					L92 218 L82 374 L74 372 L70 360
					L62 198 L55 168
					L55 100 L48 142 L34 200
					L20 195 L24 148 L35 102
					L45 98 C52 75 70 62 92 58
					L92 52
					C86 48 78 40 78 28
					C78 18 82 5 100 5
					Z
				`}
				fill="#3a3a3a"
			/>

			{/* Feet */}
			<path
				d="M66 374 Q78 372 90 374 L88 386 Q78 388 68 386 Z"
				fill="#3a3a3a"
			/>
			<path
				d="M110 374 Q122 372 134 374 L132 386 Q122 388 112 386 Z"
				fill="#3a3a3a"
			/>

			{/* === MUSCLES === */}

			{/* Chest - Pectoralis */}
			<path
				d="M60 88 Q65 82 78 85 Q88 88 98 95 L98 108 Q88 118 72 115 Q62 112 58 105 Q56 95 60 88 Z"
				fill={getColor("chest")}
				data-muscle="chest"
			/>
			<path
				d="M140 88 Q135 82 122 85 Q112 88 102 95 L102 108 Q112 118 128 115 Q138 112 142 105 Q144 95 140 88 Z"
				fill={getColor("chest")}
				data-muscle="chest"
			/>

			{/* Front Delts */}
			<path
				d="M52 72 Q62 68 68 75 Q72 85 68 98 Q60 100 52 95 Q46 88 48 78 Q50 72 52 72 Z"
				fill={getColor("front_delts")}
				data-muscle="front_delts"
			/>
			<path
				d="M148 72 Q138 68 132 75 Q128 85 132 98 Q140 100 148 95 Q154 88 152 78 Q150 72 148 72 Z"
				fill={getColor("front_delts")}
				data-muscle="front_delts"
			/>

			{/* Side Delts */}
			<path
				d="M42 78 Q48 74 52 80 Q54 92 50 102 Q44 104 40 98 Q36 88 38 80 Q40 76 42 78 Z"
				fill={getColor("side_delts")}
				data-muscle="side_delts"
			/>
			<path
				d="M158 78 Q152 74 148 80 Q146 92 150 102 Q156 104 160 98 Q164 88 162 80 Q160 76 158 78 Z"
				fill={getColor("side_delts")}
				data-muscle="side_delts"
			/>

			{/* Biceps */}
			<path
				d="M38 102 Q46 100 50 108 Q52 122 50 138 Q46 142 38 140 Q32 136 30 122 Q30 108 38 102 Z"
				fill={getColor("biceps")}
				data-muscle="biceps"
			/>
			<path
				d="M162 102 Q154 100 150 108 Q148 122 150 138 Q154 142 162 140 Q168 136 170 122 Q170 108 162 102 Z"
				fill={getColor("biceps")}
				data-muscle="biceps"
			/>

			{/* Triceps */}
			<path
				d="M30 105 Q36 102 38 110 Q38 125 36 135 Q32 138 28 132 Q24 122 26 110 Q28 104 30 105 Z"
				fill={getColor("triceps")}
				data-muscle="triceps"
			/>
			<path
				d="M170 105 Q164 102 162 110 Q162 125 164 135 Q168 138 172 132 Q176 122 174 110 Q172 104 170 105 Z"
				fill={getColor("triceps")}
				data-muscle="triceps"
			/>

			{/* Forearms */}
			<path
				d="M28 142 Q36 140 40 150 Q42 165 40 180 Q36 185 28 182 Q22 178 22 162 Q24 148 28 142 Z"
				fill={getColor("forearms_front")}
				data-muscle="forearms_front"
			/>
			<path
				d="M172 142 Q164 140 160 150 Q158 165 160 180 Q164 185 172 182 Q178 178 178 162 Q176 148 172 142 Z"
				fill={getColor("forearms_front")}
				data-muscle="forearms_front"
			/>

			{/* Abs - 6 segments */}
			<path
				d="M92 120 L108 120 Q112 125 112 135 L112 170 Q108 178 100 178 Q92 178 88 170 L88 135 Q88 125 92 120 Z"
				fill={getColor("abs")}
				data-muscle="abs"
			/>

			{/* Obliques */}
			<path
				d="M68 118 Q76 115 82 125 Q86 145 82 168 Q76 175 68 170 Q62 160 64 140 Q66 125 68 118 Z"
				fill={getColor("obliques")}
				data-muscle="obliques"
			/>
			<path
				d="M132 118 Q124 115 118 125 Q114 145 118 168 Q124 175 132 170 Q138 160 136 140 Q134 125 132 118 Z"
				fill={getColor("obliques")}
				data-muscle="obliques"
			/>

			{/* Hip Flexors */}
			<path
				d="M70 180 Q82 176 92 182 Q96 190 92 200 Q82 206 72 202 Q66 195 70 180 Z"
				fill={getColor("hip_flexors")}
				data-muscle="hip_flexors"
			/>
			<path
				d="M130 180 Q118 176 108 182 Q104 190 108 200 Q118 206 128 202 Q134 195 130 180 Z"
				fill={getColor("hip_flexors")}
				data-muscle="hip_flexors"
			/>

			{/* Quads - Rectus Femoris + Vastus */}
			<path
				d="M68 210 Q82 205 92 215 Q98 250 96 300 Q94 330 88 340 Q78 345 70 340 Q64 330 62 290 Q60 240 68 210 Z"
				fill={getColor("quads")}
				data-muscle="quads"
			/>
			<path
				d="M132 210 Q118 205 108 215 Q102 250 104 300 Q106 330 112 340 Q122 345 130 340 Q136 330 138 290 Q140 240 132 210 Z"
				fill={getColor("quads")}
				data-muscle="quads"
			/>

			{/* Adductors */}
			<path
				d="M92 215 Q98 212 100 220 L100 275 Q96 282 92 278 Q88 270 88 245 Q90 225 92 215 Z"
				fill={getColor("adductors")}
				data-muscle="adductors"
			/>
			<path
				d="M108 215 Q102 212 100 220 L100 275 Q104 282 108 278 Q112 270 112 245 Q110 225 108 215 Z"
				fill={getColor("adductors")}
				data-muscle="adductors"
			/>

			{/* Tibialis */}
			<path
				d="M72 338 Q80 335 84 345 Q86 360 84 372 Q78 376 72 372 Q68 362 70 348 Q72 340 72 338 Z"
				fill={getColor("tibialis")}
				data-muscle="tibialis"
			/>
			<path
				d="M128 338 Q120 335 116 345 Q114 360 116 372 Q122 376 128 372 Q132 362 130 348 Q128 340 128 338 Z"
				fill={getColor("tibialis")}
				data-muscle="tibialis"
			/>
		</svg>
	);
}
