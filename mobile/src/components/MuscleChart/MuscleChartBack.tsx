/**
 * BACK VIEW MUSCLE CHART SVG
 * Defined muscle paths for anatomical visualization
 */

interface Props {
	getColor: (muscleId: string) => string;
}

export function MuscleChartBack({ getColor }: Props) {
	return (
		<svg viewBox="0 0 200 400" className="muscle-chart-svg" role="img">
			<title>Back view muscle chart</title>

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

			{/* Traps */}
			<path
				d="M78 55 Q88 52 100 58 Q112 52 122 55 L132 72 Q125 82 118 92 L100 98 L82 92 Q75 82 68 72 Z"
				fill={getColor("traps")}
				data-muscle="traps"
			/>

			{/* Rear Delts */}
			<path
				d="M52 78 Q62 72 70 80 Q74 92 68 102 Q58 106 50 100 Q44 92 48 82 Q50 78 52 78 Z"
				fill={getColor("rear_delts")}
				data-muscle="rear_delts"
			/>
			<path
				d="M148 78 Q138 72 130 80 Q126 92 132 102 Q142 106 150 100 Q156 92 152 82 Q150 78 148 78 Z"
				fill={getColor("rear_delts")}
				data-muscle="rear_delts"
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

			{/* Rhomboids */}
			<path
				d="M80 88 Q90 85 98 92 Q100 105 96 115 Q88 118 80 112 Q76 102 78 92 Q80 88 80 88 Z"
				fill={getColor("rhomboids")}
				data-muscle="rhomboids"
			/>
			<path
				d="M120 88 Q110 85 102 92 Q100 105 104 115 Q112 118 120 112 Q124 102 122 92 Q120 88 120 88 Z"
				fill={getColor("rhomboids")}
				data-muscle="rhomboids"
			/>

			{/* Lats */}
			<path
				d="M68 98 Q76 95 82 105 Q86 130 82 165 Q74 172 66 168 Q58 155 62 125 Q66 105 68 98 Z"
				fill={getColor("lats")}
				data-muscle="lats"
			/>
			<path
				d="M132 98 Q124 95 118 105 Q114 130 118 165 Q126 172 134 168 Q142 155 138 125 Q134 105 132 98 Z"
				fill={getColor("lats")}
				data-muscle="lats"
			/>

			{/* Triceps */}
			<path
				d="M36 100 Q46 96 50 108 Q52 128 48 145 Q40 150 32 145 Q26 132 28 115 Q32 102 36 100 Z"
				fill={getColor("triceps")}
				data-muscle="triceps"
			/>
			<path
				d="M164 100 Q154 96 150 108 Q148 128 152 145 Q160 150 168 145 Q174 132 172 115 Q168 102 164 100 Z"
				fill={getColor("triceps")}
				data-muscle="triceps"
			/>

			{/* Forearms (back) */}
			<path
				d="M28 148 Q38 145 42 155 Q44 170 42 185 Q36 190 28 186 Q22 180 22 168 Q24 155 28 148 Z"
				fill={getColor("forearms_back")}
				data-muscle="forearms_back"
			/>
			<path
				d="M172 148 Q162 145 158 155 Q156 170 158 185 Q164 190 172 186 Q178 180 178 168 Q176 155 172 148 Z"
				fill={getColor("forearms_back")}
				data-muscle="forearms_back"
			/>

			{/* Lower Back / Erector Spinae */}
			<path
				d="M88 118 Q100 115 112 118 Q116 130 114 165 Q108 172 100 172 Q92 172 86 165 Q84 130 88 118 Z"
				fill={getColor("lower_back")}
				data-muscle="lower_back"
			/>

			{/* Glutes */}
			<path
				d="M68 178 Q82 172 95 180 Q100 195 95 212 Q82 220 68 212 Q62 198 68 178 Z"
				fill={getColor("glutes")}
				data-muscle="glutes"
			/>
			<path
				d="M132 178 Q118 172 105 180 Q100 195 105 212 Q118 220 132 212 Q138 198 132 178 Z"
				fill={getColor("glutes")}
				data-muscle="glutes"
			/>

			{/* Hamstrings */}
			<path
				d="M68 218 Q82 212 92 222 Q96 265 94 310 Q90 335 84 342 Q74 346 68 340 Q62 325 64 280 Q66 235 68 218 Z"
				fill={getColor("hamstrings")}
				data-muscle="hamstrings"
			/>
			<path
				d="M132 218 Q118 212 108 222 Q104 265 106 310 Q110 335 116 342 Q126 346 132 340 Q138 325 136 280 Q134 235 132 218 Z"
				fill={getColor("hamstrings")}
				data-muscle="hamstrings"
			/>

			{/* Calves */}
			<path
				d="M68 338 Q80 332 88 342 Q92 358 88 374 Q78 380 70 374 Q64 360 68 345 Q70 340 68 338 Z"
				fill={getColor("calves")}
				data-muscle="calves"
			/>
			<path
				d="M132 338 Q120 332 112 342 Q108 358 112 374 Q122 380 130 374 Q136 360 132 345 Q130 340 132 338 Z"
				fill={getColor("calves")}
				data-muscle="calves"
			/>
		</svg>
	);
}
