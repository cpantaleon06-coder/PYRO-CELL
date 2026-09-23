%% RIO-LIMPIEZA: Interceptor fluvial + planta de procesamiento en tierra
% Stream 2 de la plataforma PYRO-CELL. Especificaciones del interceptor tomadas de
% las hojas tecnicas reales de The Ocean Cleanup (Interceptor Original), no inventadas.
% Composicion de plastico en desechos flotantes: 70% (redondeo conservador entre 66%,
% Benioff Ocean Science Lab, y 77.8%, estudio del rio Krueng Aceh, Indonesia).
% La division 50/50 entre reciclaje mecanico y pirolisis es un SUPUESTO ilustrativo,
% no una caracterizacion real de composicion de plastico recolectado.

clear; clc; close all;

%% 1. BALANCE DE MASA
interceptor_kg_day = 50000;      % capacidad real "fully operational" del Interceptor Original
plastic_fraction = 0.70;         % ver nota de fuentes arriba
mech_split = 0.5;                % supuesto ilustrativo, no medido
pyro_split = 0.5;                % supuesto ilustrativo, no medido
pyro_oil_yield = 0.65;           % supuesto de rendimiento tipico pirolisis-a-aceite

plastic_kg_day = interceptor_kg_day * plastic_fraction;
other_debris_kg_day = interceptor_kg_day - plastic_kg_day;
mech_kg_day = plastic_kg_day * mech_split;
pyro_kg_day = plastic_kg_day * pyro_split;
pyro_oil_kg_day = pyro_kg_day * pyro_oil_yield;

fprintf('Recoleccion: %.0f kg/dia | Plastico (70%%): %.0f kg/dia | Otros: %.0f kg/dia\n', ...
    interceptor_kg_day, plastic_kg_day, other_debris_kg_day);
fprintf('Mecanico: %.0f kg/dia | Pirolisis: %.0f kg/dia -> aceite: %.0f kg/dia\n', ...
    mech_kg_day, pyro_kg_day, pyro_oil_kg_day);

%% 2. FIGURA 1: INTERCEPTOR FLUVIAL (en el rio)
fig1 = figure('Name', '1. River Interceptor (real specs, The Ocean Cleanup Original)', ...
    'NumberTitle', 'off', 'Color', [0.08 0.08 0.12], 'Position', [30 50 1000 550]);

ax1 = axes('Parent', fig1, 'Color', [0.05 0.08 0.12], 'XColor', 'w', 'YColor', 'w', 'ZColor', 'w');
hold(ax1, 'on'); grid(ax1, 'on'); view(ax1, [-30 22]); axis(ax1, 'equal');
title(ax1, 'RIVER INTERCEPTOR ORIGINAL: 8m x 24m x 5m (especificacion real, The Ocean Cleanup)', ...
    'Color', 'w', 'FontSize', 10);
xlabel(ax1, 'Longitud (m)'); ylabel(ax1, 'Ancho del rio (m)'); zlabel(ax1, 'Altura (m)');
xlim(ax1, [-5 60]); ylim(ax1, [-5 40]); zlim(ax1, [-2 8]);

% Superficie del agua
fill3(ax1, [-5 60 60 -5], [-5 -5 40 40], [0 0 0 0], [0.05 0.15 0.25], 'EdgeColor', 'none', 'FaceAlpha', 0.6);

% Barrera angulada: cubre solo la mitad del rio (deja paso a navegacion y fauna,
% tal como especifica el diseno real del Interceptor)
plot3(ax1, [0 20], [0 20], [0.3 0.3], 'Color', [0.9 0.7 0.2], 'LineWidth', 4);
text(ax1, 10, 12, 0.8, 'Barrera (cubre 50% del rio)', 'Color', [0.9 0.7 0.2], 'FontSize', 7, 'HorizontalAlignment', 'center');

% Casco catamaran del Interceptor: 8m x 24m x 5m
draw_box(ax1, 18, 8, 0, 24, 8, 5, [0.15 0.35 0.55], 'Interceptor Original (8x24x5 m)');

% Panel solar en cubierta (100% solar-powered, especificacion real)
[Xpv, Ypv] = meshgrid(19:2:39, 9:1.5:14);
for k = 1:numel(Xpv)
    patch(ax1, Xpv(k)+[0 1.6 1.6 0], Ypv(k)+[0 0 1.1 1.1], [5 5.3 5 4.7], [0.15 0.25 0.55], 'EdgeColor', [0.4 0.6 0.9]);
end
text(ax1, 29, 11.5, 6, '100% solar + bateria ion-litio', 'Color', [0.5 0.7 1], 'FontSize', 7, 'HorizontalAlignment', 'center');

% Banda transportadora hacia la barcaza de 6 contenedores (capacidad 50 m3, especificacion real)
plot3(ax1, [18 12], [10 10], [1 1.5], 'Color', [0.8 0.8 0.8], 'LineWidth', 3);
for i = 0:5
    draw_box(ax1, 4+i*1.4, 6, 0, 1.2, 4, 1.8, [0.3 0.3 0.35], '');
end
text(ax1, 8, 3.5, 2.5, '6 contenedores, 50 m3 total', 'Color', [0.85 0.85 0.85], 'FontSize', 7, 'HorizontalAlignment', 'center');

camlight(ax1, 'headlight'); lighting(ax1, 'gouraud');

%% 3. FIGURA 2: PLANTA DE PROCESAMIENTO EN TIERRA
fig2 = figure('Name', '2. Shore Processing Facility', 'NumberTitle', 'off', ...
    'Color', [0.08 0.08 0.12], 'Position', [1050 50 950 550]);

ax2 = axes('Parent', fig2, 'Color', [0.05 0.08 0.12], 'XColor', 'w', 'YColor', 'w', 'ZColor', 'w');
hold(ax2, 'on'); grid(ax2, 'on'); view(ax2, [-32 24]); axis(ax2, 'equal');
title(ax2, 'PLANTA DE PROCESAMIENTO EN TIERRA (recibe la barcaza del interceptor)', 'Color', 'w', 'FontSize', 10);
xlabel(ax2, 'Longitud (m)'); ylabel(ax2, 'Ancho (m)'); zlabel(ax2, 'Altura (m)');
xlim(ax2, [-5 45]); ylim(ax2, [-5 25]); zlim(ax2, [0 10]);

fill3(ax2, [0 40 40 0], [0 0 20 20], [0 0 0 0], [0.2 0.2 0.22], 'EdgeColor', [0.4 0.4 0.5]);

% Etapa 1: recepcion y clasificacion (separa plastico del resto, 70/30 supuesto)
draw_box(ax2, 1, 2, 0, 7, 8, 3, [0.15 0.4 0.5], 'Recepcion + clasificacion');

% Etapa 2a: linea de reciclaje mecanico (trituracion, lavado, peletizado)
draw_box(ax2, 12, 2, 0, 8, 7, 3, [0.2 0.5 0.25], 'Reciclaje mecanico');
text(ax2, 16, 5.5, 3.8, sprintf('%.0f kg/dia -> pellets', 17500), 'Color', [0.5 0.9 0.5], 'FontSize', 7, 'HorizontalAlignment', 'center');

% Etapa 2b: linea de pirolisis de plastico (reactor separado, quimica distinta a sargazo)
[xp, yp, zp] = cylinder(1, 20);
surf(ax2, xp*1.3 + 26, yp*1.3 + 6, zp*5 + 1.5, 'FaceColor', [0.7 0.3 0.15], 'EdgeColor', 'none');
text(ax2, 26, 6, 8, 'Reactor de pirolisis de plastico', 'Color', [1 0.5 0.3], 'FontWeight', 'bold', 'FontSize', 7, 'HorizontalAlignment', 'center');
text(ax2, 26, 6, 7.2, '(reactor separado, quimica distinta al de sargazo)', 'Color', [0.9 0.6 0.5], 'FontSize', 6, 'HorizontalAlignment', 'center');
text(ax2, 26, 6, -1, sprintf('%.0f kg/dia -> %.0f kg/dia aceite', 17500, 11375), 'Color', [1 0.7 0.5], 'FontSize', 7, 'HorizontalAlignment', 'center');

% Tratamiento de gases de escape (obligatorio para pirolisis de plastico, salvedad de emisiones)
draw_box(ax2, 32, 3, 0, 4, 6, 4, [0.3 0.2 0.15], 'Tratamiento de gases');
text(ax2, 34, 10, 0.5, 'requiere verificar clasificacion regulatoria en Mexico', 'Color', [0.9 0.5 0.4], 'FontSize', 6, 'HorizontalAlignment', 'center');

% Fraccion no aprovechable (30% del total, ~15,000 kg/dia) a gestion de residuos externa
draw_box(ax2, 1, 13, 0, 6, 5, 2, [0.25 0.25 0.28], 'Fraccion no plastica (30%)');
text(ax2, 4, 15.5, 2.8, sprintf('%.0f kg/dia -> gestion externa', 15000), 'Color', [0.7 0.7 0.7], 'FontSize', 6, 'HorizontalAlignment', 'center');

camlight(ax2, 'headlight'); lighting(ax2, 'gouraud');

%% 4. NOTA DE FUENTES Y SUPUESTOS (impresa en consola, no solo en comentarios)
fprintf('\n--- FUENTES ---\n');
fprintf('Dimensiones y capacidad del Interceptor: hoja tecnica oficial The Ocean Cleanup\n');
fprintf('Fraccion de plastico en desechos flotantes: Benioff Ocean Science Lab (66%%) y\n');
fprintf('  estudio rio Krueng Aceh, Indonesia (77.8%%), redondeado a 70%% de forma conservadora\n');
fprintf('--- SUPUESTOS SIN VERIFICAR, NO CONFUNDIR CON DATOS MEDIDOS ---\n');
fprintf('Division 50/50 mecanico/pirolisis: ilustrativa, sin caracterizacion real de composicion\n');
fprintf('Rendimiento de aceite de pirolisis (65%%): cifra tipica de literatura, no medida en este proyecto\n');
fprintf('Clasificacion regulatoria de pirolisis de plastico en Mexico: pendiente de verificar\n');

function draw_box(ax, x, y, z, dx, dy, dz, color, label_text)
    vertices = [x y z; x+dx y z; x+dx y+dy z; x y+dy z; ...
                x y z+dz; x+dx y z+dz; x+dx y+dy z+dz; x y+dy z+dz];
    faces = [1 2 6 5; 2 3 7 6; 3 4 8 7; 4 1 5 8; 1 2 3 4; 5 6 7 8];
    patch('Parent', ax, 'Vertices', vertices, 'Faces', faces, ...
          'FaceColor', color, 'EdgeColor', 'w', 'FaceAlpha', 0.7);
    if ~isempty(label_text)
        text(ax, x + dx/2, y + dy/2, z + dz + 0.6, label_text, ...
             'Color', 'w', 'FontWeight', 'bold', 'HorizontalAlignment', 'center', 'FontSize', 7);
    end
end
