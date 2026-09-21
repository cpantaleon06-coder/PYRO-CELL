

clear; 
clc; 
close all;


fig1 = figure('Name', '1. Full Scale Industrial Plant Layout', ...
    'NumberTitle', 'off', 'Color', [0.08 0.08 0.12], 'Position', [30 50 900 600]);

ax1 = axes('Parent', fig1, 'Color', [0.05 0.05 0.08], 'XColor', 'w', 'YColor', 'w', 'ZColor', 'w');
hold(ax1, 'on'); grid(ax1, 'on'); view(ax1, [-35 25]);
title(ax1, 'PYRO-CELL INDUSTRIAL PLANT 3D LAYOUT (FOOTPRINT: 45m x 25m)', 'Color', 'w', 'FontSize', 11);
xlabel(ax1, 'Length (m)'); ylabel(ax1, 'Width (m)'); zlabel(ax1, 'Height (m)');
xlim(ax1, [-5 50]); ylim(ax1, [-5 30]); zlim(ax1, [0 12]);


fill3(ax1, [0 45 45 0], [0 0 25 25], [0 0 0 0], [0.2 0.2 0.22], 'EdgeColor', [0.4 0.4 0.5]);

plot3(ax1, [0 45 45 0 0], [0 0 25 25 0], [8 8 8 8 8], 'Color', [0.3 0.6 0.9], 'LineWidth', 1.5);
for xw = [0 45], for yw = [0 25], plot3(ax1, [xw xw], [yw yw], [0 8], 'Color', [0.3 0.6 0.9], 'LineWidth', 1.5); end; end

% ===== ETAPA 1: recepcion y centrifugado =====
draw_box(ax1, 1, 2, 0, 6, 10, 3, [0.1 0.4 0.5], 'Stage 1: Intake & Centrifuges');

% PV array que alimenta la Etapa 1 (8.3 kWp ~ 45 m2, PYRO_CELL.md v2)
[Xpv, Ypv] = meshgrid(1.5:1.3:6.5, 15.5:1.8:22);
for k = 1:numel(Xpv)
    patch(ax1, Xpv(k)+[0 1 1 0], Ypv(k)+[0 0 1.3 1.3], [2.2 2.6 2.2 1.8], [0.15 0.25 0.55], 'EdgeColor', [0.4 0.6 0.9]);
end
text(ax1, 4, 15.5, 1.6, 'PV 8.3 kWp (Etapa 1)', 'Color', [0.5 0.7 1], 'FontWeight', 'bold', 'FontSize', 7, 'HorizontalAlignment', 'center');

% ===== ETAPA 2: invernadero pasivo (35 m2) + colectores termicos (89.4 m2), separados =====
draw_box(ax1, 10, 2, 0, 5, 7, 3.5, [0.15 0.5 0.2], 'Invernadero pasivo, 35 m2');
[Xm, Ym] = meshgrid(10.3:0.6:14.7, 2.3:0.6:8.7);
plot3(ax1, Xm(:), Ym(:), ones(numel(Xm), 1)*3.5, '.', 'Color', [0.5 0.9 0.4], 'MarkerSize', 5);

draw_box(ax1, 10, 12, 0, 10, 9, 2, [0.5 0.35 0.1], 'Colectores termicos, 89.4 m2');
[Xt, Yt] = meshgrid(10.6:1.1:19.4, 12.6:1.1:20.4);
plot3(ax1, Xt(:), Yt(:), ones(numel(Xt), 1)*2, 'o', 'Color', [1 0.7 0.2], 'MarkerSize', 3, 'MarkerFaceColor', [1 0.7 0.2]);

% ===== ETAPA 3: reactor de pirolisis (400-600C, diseno 500C) + campo CSP =====
[xc, yc, zc] = cylinder(1, 20);
% Radio 1.5 m (diametro 3 m) y altura 6 m son ilustrativos: no hay calculo de
% ingenieria del volumen/tiempo de residencia del reactor todavia en el proyecto.
surf(ax1, xc*1.5 + 25, yc*1.5 + 6, zc*6 + 2, 'FaceColor', [0.8 0.3 0.1], 'EdgeColor', 'none');
text(ax1, 25, 6, 10.3, 'Stage 3: Reactor (400-600C, diseno 500C)', 'Color', [1 0.5 0.2], 'FontWeight', 'bold', 'FontSize', 7, 'HorizontalAlignment', 'center');

draw_box(ax1, 23, 14, 0, 10, 8, 0.3, [0.2 0.2 0.3], 'Campo CSP (ilustrativo, sin dimensionar)');
for cx = 24:2:32
    plot3(ax1, [cx cx], [14.5 21.5], [1.5 1.5], 'Color', [0.7 0.85 1], 'LineWidth', 1.5);
end

% ===== ETAPA 4: banco de filtros de biochar (agua, ver salvedad de lixiviacion) =====
filter_positions_y = [3, 8, 13, 18];
for i = 1:length(filter_positions_y)
    fy = filter_positions_y(i);
    [xf, yf, zf] = cylinder(0.8, 20);
    surf(ax1, xf*1 + 38, yf*1 + fy, zf*4, 'FaceColor', [0.2 0.7 0.9], 'EdgeColor', 'none');
    plot3(ax1, [33 38], [8 fy], [2 2], 'Color', [0.8 0.8 0.8], 'LineWidth', 1.5);
end
text(ax1, 38, 21, 5, 'Stage 4: Biochar Filter Bank (agua)', 'Color', [0.3 0.8 1], 'FontWeight', 'bold', 'FontSize', 7, 'HorizontalAlignment', 'center');
text(ax1, 38, 21, 4.2, 'requiere prueba de lixiviacion antes de operar', 'Color', [0.9 0.6 0.5], 'FontSize', 6, 'HorizontalAlignment', 'center');

% Ciclo de regeneracion termica: filtro saturado vuelve al reactor (linea punteada)
plot3(ax1, [38 25], [1.5 3], [4.5 8], 'Color', [1 0.85 0.3], 'LineWidth', 1.5, 'LineStyle', '--');
text(ax1, 31.5, -2, 6, 'Regeneracion termica (600-800C)', 'Color', [1 0.85 0.3], 'FontSize', 6, 'HorizontalAlignment', 'center');

% ===== Bodega de colchon de reserva sellada (16.5 t, ~82.7 m3) =====
draw_box(ax1, 36, 20, 0, 6, 4.5, 3, [0.3 0.3 0.35], 'Bodega colchon (16.5 t)');

% ===== Leyenda fija en 2D (no rota con la camara, evita que las etiquetas 3D se amontonen) =====
leyenda = sprintf(['1. Recepcion y centrifugado (8.3 kWp, PV)\n' ...
    '2. Arreglo fotovoltaico Etapa 1\n' ...
    '3. Invernadero pasivo, 35 m2\n' ...
    '4. Colectores termicos, 89.4 m2\n' ...
    '5. Reactor de pirolisis, 400-600C (diseno 500C)\n' ...
    '6. Campo CSP (ilustrativo, sin dimensionar)\n' ...
    '7. Banco de filtros de biochar -- requiere\n' ...
    '    prueba de lixiviacion antes de operar\n' ...
    '8. Bodega colchon sellada, 16.5 t\n' ...
    '- - -  Ciclo de regeneracion termica (600-800C)']);
annotation(fig1, 'textbox', [0.01 0.08 0.27 0.42], 'String', leyenda, ...
    'Color', 'w', 'FontSize', 8, 'BackgroundColor', [0.12 0.12 0.16], ...
    'EdgeColor', [0.4 0.4 0.5], 'FitBoxToText', 'off', 'Interpreter', 'none');


camlight(ax1, 'headlight'); lighting(ax1, 'gouraud');


fig2 = figure('Name', '2. Biochar Filter & Final Product Model', ...
    'NumberTitle', 'off', 'Color', [0.1 0.1 0.12], 'Position', [400 50 600 600]);

ax2 = axes('Parent', fig2, 'Color', [0.05 0.05 0.08], 'XColor', 'w', 'YColor', 'w', 'ZColor', 'w');
hold(ax2, 'on'); grid(ax2, 'on'); view(ax2, [25 20]);
title(ax2, '3D BIOCHAR ACTIVATED FILTER VESSEL & DISCHARGE', 'Color', 'w', 'FontSize', 11);
xlabel(ax2, 'X (m)'); ylabel(ax2, 'Y (m)'); zlabel(ax2, 'Height (m)');
xlim(ax2, [-2.5 2.5]); ylim(ax2, [-2.5 2.5]); zlim(ax2, [0 5]);

[xv, yv, zv] = cylinder(1.2, 30);
surf(ax2, xv, yv, zv*3 + 1, 'FaceColor', [0.3 0.5 0.7], 'FaceAlpha', 0.35, 'EdgeColor', [0.5 0.7 0.9]);

[xb, yb, zb] = cylinder(1.15, 30);
surf(ax2, xb, yb, zb*2 + 1.2, 'FaceColor', [0.12 0.12 0.15], 'EdgeColor', 'none');
text(ax2, 0, 0, 2.2, {'ACTIVATED BIOCHAR', 'FILTER MEDIA BED'}, 'Color', 'w', 'HorizontalAlignment', 'center', 'FontWeight', 'bold');

plot3(ax2, [0 0], [0 0], [4 4.8], 'LineWidth', 6, 'Color', [0.2 0.8 1]);
text(ax2, 0, 0, 4.9, 'FLUID INLET', 'Color', [0.2 0.8 1], 'HorizontalAlignment', 'center', 'FontWeight', 'bold');

num_granules = 120;
theta = rand(1, num_granules) * 2 * pi; r = rand(1, num_granules) * 0.8;
xp = r .* cos(theta); yp = r .* sin(theta); zp = rand(1, num_granules) * 0.8;
plot3(ax2, xp, yp, zp, 'k.', 'MarkerSize', 12);
text(ax2, 0, 0, 0.3, {'PURIFIED PRODUCT DISCHARGE'}, 'Color', [0.4 1 0.4], 'HorizontalAlignment', 'center', 'FontWeight', 'bold');

camlight(ax2, 'headlight'); lighting(ax2, 'gouraud');


fig3 = figure('Name', '3. Installation in Industrial Wastewater Plant', ...
    'NumberTitle', 'off', 'Color', [0.08 0.08 0.12], 'Position', [750 50 800 600]);

ax3 = axes('Parent', fig3, 'Color', [0.05 0.05 0.08], 'XColor', 'w', 'YColor', 'w', 'ZColor', 'w');
hold(ax3, 'on'); grid(ax3, 'on'); view(ax3, [-30 30]);
title(ax3, 'PYRO-CELL BIOCHAR FILTERS INSTALLED IN INDUSTRIAL WATER TREATMENT PLANT', 'Color', 'w', 'FontSize', 11);
xlabel(ax3, 'X (m)'); ylabel(ax3, 'Y (m)'); zlabel(ax3, 'Height (m)');
xlim(ax3, [-5 35]); ylim(ax3, [-5 25]); zlim(ax3, [0 10]);

fill3(ax3, [-5 35 35 -5], [-5 -5 25 25], [0 0 0 0], [0.18 0.18 0.2], 'EdgeColor', 'none');

[xt, yt, zt] = cylinder(4.0, 30);
surf(ax3, xt + 3, yt + 10, zt*3, 'FaceColor', [0.2 0.4 0.3], 'FaceAlpha', 0.8, 'EdgeColor', 'none');
text(ax3, 3, 10, 3.8, {'PRIMARY CLARIFIER', 'Wastewater Intake'}, 'Color', [0.5 1 0.6], 'FontWeight', 'bold', 'FontSize', 8, 'HorizontalAlignment', 'center');

filter_x = [15, 15, 15, 20, 20, 20];
filter_y = [5, 10, 15, 5, 10, 15];
for i = 1:length(filter_x)
    fx = filter_x(i); fy = filter_y(i);
    [xf, yf, zf] = cylinder(1.0, 20);
    surf(ax3, xf + fx, yf + fy, zf*4.5, 'FaceColor', [0.1 0.6 0.8], 'EdgeColor', 'none');

    rectangle(ax3, 'Position', [fx-1.2, fy-1.2, 2.4, 2.4], 'FaceColor', [0.3 0.3 0.35], 'EdgeColor', 'none');
end
text(ax3, 17.5, 10, 5.8, {'PYRO-CELL BIOCHAR FILTER MATRIX', '(Tertiary Adsorption Stage)'}, ...
    'Color', [0.3 0.9 1], 'FontWeight', 'bold', 'FontSize', 9, 'HorizontalAlignment', 'center');


draw_box(ax3, 27, 4, 0, 6, 12, 2.5, [0.1 0.4 0.7], 'Treated Water Storage Basin');


plot3(ax3, [3 15 15], [10 10 5], [2.5 2.5 4.5], 'LineWidth', 3, 'Color', [0.8 0.6 0.2]);

plot3(ax3, [20 27], [10 10], [1 1], 'LineWidth', 3.5, 'Color', [0.2 0.8 1]);

camlight(ax3, 'headlight'); lighting(ax3, 'gouraud');


function draw_box(ax, x, y, z, dx, dy, dz, color, label_text)
    vertices = [x y z; x+dx y z; x+dx y+dy z; x y+dy z; ...
                x y z+dz; x+dx y z+dz; x+dx y+dy z+dz; x y+dy z+dz];
    faces = [1 2 6 5; 2 3 7 6; 3 4 8 7; 4 1 5 8; 1 2 3 4; 5 6 7 8];
    patch('Parent', ax, 'Vertices', vertices, 'Faces', faces, ...
          'FaceColor', color, 'EdgeColor', 'w', 'FaceAlpha', 0.7);
    text(ax, x + dx/2, y + dy/2, z + dz + 0.8, label_text, ...
         'Color', 'w', 'FontWeight', 'bold', 'HorizontalAlignment', 'center', 'FontSize', 8);
end